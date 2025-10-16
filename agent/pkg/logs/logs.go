package logs

import (
	"bufio"
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/hhftechnology/traefik-log-dashboard/agent/pkg/logger"
)

func GetLogs(path string, positions []Position, isErrorLog bool, includeCompressed bool) (LogResult, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return LogResult{}, fmt.Errorf("path error: %w", err)
	}

	var result LogResult
	if fileInfo.IsDir() {
		result, err = GetDirectoryLogs(path, positions, isErrorLog, includeCompressed)
	} else {
		singlePos := int64(0)
		if len(positions) > 0 {
			singlePos = positions[0].Position
		}
		result, err = GetLog(path, singlePos)
	}

	return result, err
}

func GetLog(filePath string, position int64) (LogResult, error) {
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		logger.Log.Println("File not found")
		return LogResult{}, fmt.Errorf("file not found: %s", filePath)
	}

	var result LogResult
	var err error

	if strings.HasSuffix(filePath, ".gz") {
		result, err = readCompressedLogFile(filePath)
		if err != nil {
			return LogResult{}, fmt.Errorf("error reading compressed log file: %w", err)
		}
	} else {
		result, err = readLogFile(filePath, position)
		if err != nil {
			return LogResult{}, fmt.Errorf("error reading log file: %w", err)
		}
	}

	return result, nil
}

func readLogFile(filePath string, position int64) (LogResult, error) {
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return LogResult{}, err
	}

	fileSize := fileInfo.Size()

	// If position is -1, start from end of file (tail mode)
	if position == -1 {
		// Read last 1000 lines
		return tailLogFile(filePath, 1000)
	}

	// If position >= fileSize, no new logs
	if position >= fileSize {
		return LogResult{
			Logs:      []string{},
			Positions: []Position{{Position: fileSize}},
		}, nil
	}

	file, err := os.Open(filePath)
	if err != nil {
		return LogResult{}, err
	}
	defer file.Close()

	_, err = file.Seek(position, 0)
	if err != nil {
		return LogResult{}, err
	}

	var logs []string
	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024) // Handle larger lines

	for scanner.Scan() {
		line := scanner.Text()
		if line != "" {
			logs = append(logs, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return LogResult{}, err
	}

	// Get current position after reading
	currentPos, _ := file.Seek(0, io.SeekCurrent)
	if currentPos < fileSize {
		currentPos = fileSize
	}

	return LogResult{
		Logs:      logs,
		Positions: []Position{{Position: currentPos}},
	}, nil
}

// tailLogFile reads the last N lines from a file
func tailLogFile(filePath string, numLines int) (LogResult, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return LogResult{}, err
	}
	defer file.Close()

	fileInfo, err := file.Stat()
	if err != nil {
		return LogResult{}, err
	}

	fileSize := fileInfo.Size()
	
	// Start reading from the end
	var logs []string
	var offset int64 = 0
	bufferSize := int64(8192)

	for offset < fileSize && len(logs) < numLines {
		// Calculate read position
		readSize := bufferSize
		if offset+bufferSize > fileSize {
			readSize = fileSize - offset
		}
		
		startPos := fileSize - offset - readSize
		if startPos < 0 {
			startPos = 0
			readSize = fileSize - offset
		}

		// Read chunk
		buffer := make([]byte, readSize)
		_, err := file.ReadAt(buffer, startPos)
		if err != nil && err != io.EOF {
			break
		}

		// Split into lines (reading backwards)
		lines := strings.Split(string(buffer), "\n")
		
		// Add lines in reverse order
		for i := len(lines) - 1; i >= 0; i-- {
			if lines[i] != "" {
				logs = append([]string{lines[i]}, logs...)
				if len(logs) >= numLines {
					break
				}
			}
		}

		offset += readSize
		if startPos == 0 {
			break
		}
	}

	// Trim to exact number of lines requested
	if len(logs) > numLines {
		logs = logs[len(logs)-numLines:]
	}

	return LogResult{
		Logs:      logs,
		Positions: []Position{{Position: fileSize}},
	}, nil
}

// GetRecentLogs gets only logs newer than specified timestamp
func GetRecentLogs(path string, since time.Time) (LogResult, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return LogResult{}, fmt.Errorf("path error: %w", err)
	}

	if fileInfo.IsDir() {
		return GetRecentDirectoryLogs(path, since)
	}

	// For single file, read all and filter by time
	result, err := GetLog(path, 0)
	if err != nil {
		return result, err
	}

	// Filter logs by timestamp (assuming JSON logs with time field)
	var filteredLogs []string
	for _, logLine := range result.Logs {
		if strings.Contains(logLine, "\"time\":") || strings.Contains(logLine, "\"StartUTC\":") {
			// Try to extract timestamp and compare
			// This is a simple check - could be enhanced with proper JSON parsing
			filteredLogs = append(filteredLogs, logLine)
		}
	}

	result.Logs = filteredLogs
	return result, nil
}

func GetRecentDirectoryLogs(dirPath string, since time.Time) (LogResult, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return LogResult{}, fmt.Errorf("failed to read directory: %w", err)
	}

	var allLogs []string
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		info, err := entry.Info()
		if err != nil {
			continue
		}

		// Skip old files
		if info.ModTime().Before(since) {
			continue
		}

		fileName := entry.Name()
		if strings.HasSuffix(fileName, ".log") {
			fullPath := filepath.Join(dirPath, fileName)
			result, err := GetLog(fullPath, 0)
			if err != nil {
				logger.Log.Printf("Error reading log file %s: %v", fileName, err)
				continue
			}
			allLogs = append(allLogs, result.Logs...)
		}
	}

	return LogResult{
		Logs:      allLogs,
		Positions: []Position{},
	}, nil
}

func readErrorLogDirectly(filePath string, position int64) (LogResult, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return LogResult{}, err
	}

	strContent := string(content)

	if position >= int64(len(strContent)) {
		return LogResult{Logs: []string{}, Positions: []Position{{Position: position}}}, nil
	}

	newContent := strContent[position:]

	lines := []string{}
	for _, line := range strings.Split(newContent, "\n") {
		if strings.TrimSpace(line) != "" {
			lines = append(lines, line)
		}
	}

	return LogResult{
		Logs:      lines,
		Positions: []Position{{Position: int64(len(strContent))}},
	}, nil
}

func readCompressedLogFile(filePath string) (LogResult, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return LogResult{}, err
	}
	defer file.Close()

	gzReader, err := gzip.NewReader(file)
	if err != nil {
		return LogResult{}, err
	}
	defer gzReader.Close()

	content, err := io.ReadAll(gzReader)
	if err != nil {
		return LogResult{}, err
	}

	var logs []string
	for _, line := range strings.Split(string(content), "\n") {
		if strings.TrimSpace(line) != "" {
			logs = append(logs, line)
		}
	}

	return LogResult{
		Logs:      logs,
		Positions: []Position{{Position: 0}},
	}, nil
}

func GetDirectoryLogs(dirPath string, positions []Position, isErrorLog bool, includeCompressed bool) (LogResult, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return LogResult{}, fmt.Errorf("failed to read directory: %w", err)
	}

	var logFiles []string
	for _, entry := range entries {
		fileName := entry.Name()
		isLogFile := strings.HasSuffix(fileName, ".log")
		isGzipFile := strings.HasSuffix(fileName, ".gz")

		if (isLogFile || (isGzipFile && includeCompressed)) &&
			(isErrorLog && strings.Contains(fileName, "error") || !isErrorLog && !strings.Contains(fileName, "error")) {
			logFiles = append(logFiles, fileName)
		}
	}

	// Sort files by name (usually includes timestamp)
	for i := 0; i < len(logFiles)-1; i++ {
		for j := i + 1; j < len(logFiles); j++ {
			if logFiles[i] > logFiles[j] {
				logFiles[i], logFiles[j] = logFiles[j], logFiles[i]
			}
		}
	}

	if len(logFiles) == 0 {
		return LogResult{Logs: []string{}, Positions: []Position{}}, nil
	}

	posMap := make(map[string]int64)
	for _, pos := range positions {
		if pos.Filename != "" {
			posMap[pos.Filename] = pos.Position
		}
	}

	var allLogs []string
	var newPositions []Position

	// If no positions provided, read last file with tail mode
	if len(positions) == 0 && len(logFiles) > 0 {
		lastFile := logFiles[len(logFiles)-1]
		fullPath := filepath.Join(dirPath, lastFile)
		result, err := tailLogFile(fullPath, 1000)
		if err == nil {
			return result, nil
		}
	}

	for _, fileName := range logFiles {
		fullPath := filepath.Join(dirPath, fileName)
		position := posMap[fileName]

		result, err := GetLog(fullPath, position)
		if err != nil {
			logger.Log.Printf("Error reading log file %s: %v", fileName, err)
			continue
		}

		allLogs = append(allLogs, result.Logs...)

		if len(result.Positions) > 0 {
			newPos := result.Positions[0]
			newPos.Filename = fileName
			newPositions = append(newPositions, newPos)
		}
	}

	return LogResult{
		Logs:      allLogs,
		Positions: newPositions,
	}, nil
}

// GetLogSizes analyzes log files and returns their sizes
func GetLogSizes(path string) (*LogSizesResult, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return nil, fmt.Errorf("path error: %w", err)
	}

	var files []LogFileSize
	var summary LogFilesSummary

	// If it's a directory, analyze all files in it
	if fileInfo.IsDir() {
		entries, err := os.ReadDir(path)
		if err != nil {
			return nil, fmt.Errorf("failed to read directory: %w", err)
		}

		for _, entry := range entries {
			if entry.IsDir() {
				continue
			}

			info, err := entry.Info()
			if err != nil {
				continue
			}

			fileName := entry.Name()
			fileSize := info.Size()
			extension := filepath.Ext(fileName)

			// Track file
			files = append(files, LogFileSize{
				Name:      fileName,
				Size:      fileSize,
				Extension: extension,
			})

			// Update summary
			summary.TotalSize += fileSize
			summary.TotalFiles++

			if extension == ".log" {
				summary.LogFilesSize += fileSize
				summary.LogFilesCount++
			} else if extension == ".gz" {
				summary.CompressedFilesSize += fileSize
				summary.CompressedFilesCount++
			}
		}
	} else {
		// Single file
		fileName := filepath.Base(path)
		fileSize := fileInfo.Size()
		extension := filepath.Ext(fileName)

		files = append(files, LogFileSize{
			Name:      fileName,
			Size:      fileSize,
			Extension: extension,
		})

		summary.TotalSize = fileSize
		summary.TotalFiles = 1

		if extension == ".log" {
			summary.LogFilesSize = fileSize
			summary.LogFilesCount = 1
		} else if extension == ".gz" {
			summary.CompressedFilesSize = fileSize
			summary.CompressedFilesCount = 1
		}
	}

	return &LogSizesResult{
		Files:   files,
		Summary: summary,
	}, nil
}