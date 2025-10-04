package logs

import (
	"compress/gzip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"

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

	if position >= fileSize {
		return LogResult{Logs: []string{}, Positions: []Position{{Position: position}}}, nil
	}

	if fileSize == 0 && strings.Contains(filePath, "error") {
		return readErrorLogDirectly(filePath, position)
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
	var buffer strings.Builder
	buf := make([]byte, 4096)

	for {
		n, err := file.Read(buf)
		if err != nil && err != io.EOF {
			return LogResult{}, err
		}
		if n == 0 {
			break
		}

		for i := 0; i < n; i++ {
			c := buf[i]
			if c == '\n' {
				line := buffer.String()
				if line != "" {
					logs = append(logs, line)
				}
				buffer.Reset()
			} else {
				buffer.WriteByte(c)
			}
		}
	}

	lastLine := buffer.String()
	if lastLine != "" {
		logs = append(logs, lastLine)
	}

	newPosition := fileSize

	return LogResult{
		Logs:      logs,
		Positions: []Position{{Position: newPosition}},
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

	for i := range len(logFiles) - 1 {
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