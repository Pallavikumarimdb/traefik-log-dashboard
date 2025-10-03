package cards

import (
	"fmt"
	"strings"
	"time"

	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/logs"
	"github.com/hhftechnology/traefik-log-dashboard/cli/internal/ui/styles"
)

// RenderTimeline renders a timeline of request activity
func RenderTimeline(logEntries []logs.TraefikLog, metrics *logs.Metrics, width int) string {
	if width < 40 {
		return ""
	}

	cardWidth := width
	contentWidth := cardWidth - 4

	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("📈 Request Timeline"))
	b.WriteString("\n")

	if len(logEntries) == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("No timeline data available"),
		))
		return b.String()
	}

	// Group requests by time bucket (5-minute intervals)
	buckets := groupByTimeBucket(logEntries, 5*time.Minute)

	if len(buckets) == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("Insufficient data for timeline"),
		))
		return b.String()
	}

	// Find min/max for scaling
	var maxCount int
	for _, bucket := range buckets {
		if bucket.Count > maxCount {
			maxCount = bucket.Count
		}
	}

	if maxCount == 0 {
		maxCount = 1
	}

	// Render sparkline
	sparkWidth := contentWidth - 15
	if sparkWidth > 60 {
		sparkWidth = 60
	}

	sparkline := renderSparkline(buckets, sparkWidth, maxCount)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(sparkline))
	b.WriteString("\n")

	// Timeline stats
	// FIX: Changed metrics.RequestsPerSecond to metrics.RequestsPerSec
	statsLine := fmt.Sprintf(
		"Peak: %s req/5min  |  Avg: %s req/5min  |  Current: %.1f req/sec",
		formatNumber(maxCount),
		formatNumber(calculateAverage(buckets)),
		metrics.RequestsPerSec,
	)
	b.WriteString(styles.CardStyle.Width(cardWidth).Render(
		styles.MutedStyle.Render(statsLine),
	))
	b.WriteString("\n")

	// Time range
	if len(buckets) > 0 {
		firstTime := buckets[0].Time
		lastTime := buckets[len(buckets)-1].Time
		duration := lastTime.Sub(firstTime)

		timeRange := fmt.Sprintf(
			"Time Range: %s → %s (%s)",
			firstTime.Format("15:04"),
			lastTime.Format("15:04"),
			formatTimeDuration(duration),
		)
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render(timeRange),
		))
		b.WriteString("\n")
	}

	return b.String()
}

// TimeBucket represents a time bucket with request count
type TimeBucket struct {
	Time  time.Time
	Count int
}

// groupByTimeBucket groups log entries into time buckets
func groupByTimeBucket(logs []logs.TraefikLog, interval time.Duration) []TimeBucket {
	if len(logs) == 0 {
		return nil
	}

	bucketMap := make(map[int64]int)
	var minTime, maxTime time.Time

	// Find the time range of the logs
	for i, log := range logs {
		// Assuming StartUTC is a string, parse it.
		// If it's already a time.Time, this check can be simplified.
		parsedTime, err := time.Parse(time.RFC3339Nano, log.StartUTC)
		if err != nil {
			continue // Skip logs with unparseable timestamps
		}

		if i == 0 {
			minTime = parsedTime
			maxTime = parsedTime
		} else {
			if parsedTime.Before(minTime) {
				minTime = parsedTime
			}
			if parsedTime.After(maxTime) {
				maxTime = parsedTime
			}
		}

		bucketKey := parsedTime.Unix() / int64(interval.Seconds())
		bucketMap[bucketKey]++
	}

	if minTime.IsZero() {
		return nil // No valid logs found
	}

	// Create ordered buckets
	var buckets []TimeBucket
	currentTime := minTime.Truncate(interval)
	endTime := maxTime.Truncate(interval).Add(interval)

	for !currentTime.After(endTime) {
		bucketKey := currentTime.Unix() / int64(interval.Seconds())
		count := bucketMap[bucketKey]
		buckets = append(buckets, TimeBucket{
			Time:  currentTime,
			Count: count,
		})
		currentTime = currentTime.Add(interval)
	}

	return buckets
}


// renderSparkline renders a sparkline chart
func renderSparkline(buckets []TimeBucket, width, maxCount int) string {
	if len(buckets) == 0 || width < 5 {
		return ""
	}

	// Sample buckets if we have too many
	sampledBuckets := buckets
	if len(buckets) > width {
		sampledBuckets = sampleBuckets(buckets, width)
	}

	// Height levels for sparkline
	levels := []string{" ", "▂", "▃", "▄", "▅", "▆", "▇", "█"}

	var sparkline strings.Builder
	for _, bucket := range sampledBuckets {
		if maxCount == 0 {
			maxCount = 1
		}
		level := int(float64(bucket.Count) / float64(maxCount) * float64(len(levels)-1))
		if level >= len(levels) {
			level = len(levels) - 1
		}

		// Color based on volume
		char := levels[level]
		if float64(bucket.Count)/float64(maxCount) > 0.8 {
			sparkline.WriteString(styles.ErrorStyle.Render(char))
		} else if float64(bucket.Count)/float64(maxCount) > 0.5 {
			sparkline.WriteString(styles.WarningStyle.Render(char))
		} else {
			sparkline.WriteString(styles.SuccessStyle.Render(char))
		}
	}

	return sparkline.String()
}

// sampleBuckets samples buckets to fit within width
func sampleBuckets(buckets []TimeBucket, width int) []TimeBucket {
	if len(buckets) <= width {
		return buckets
	}

	sampled := make([]TimeBucket, width)
	step := float64(len(buckets)) / float64(width)

	for i := 0; i < width; i++ {
		idx := int(float64(i) * step)
		if idx >= len(buckets) {
			idx = len(buckets) - 1
		}
		sampled[i] = buckets[idx]
	}

	return sampled
}

// calculateAverage calculates the average count across buckets
func calculateAverage(buckets []TimeBucket) int {
	if len(buckets) == 0 {
		return 0
	}

	total := 0
	for _, bucket := range buckets {
		total += bucket.Count
	}

	return total / len(buckets)
}

// formatTimeDuration formats a duration in a human-readable way
func formatTimeDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	}
	return fmt.Sprintf("%dm", minutes)
}

// RenderRequestDistribution renders request distribution over time
func RenderRequestDistribution(buckets []TimeBucket, width int) string {
	if width < 40 || len(buckets) == 0 {
		return ""
	}

	cardWidth := width
	var b strings.Builder

	// Header
	b.WriteString(styles.CardTitleStyle.Width(cardWidth).Render("📊 Request Distribution"))
	b.WriteString("\n")

	// Find max for scaling
	maxCount := 0
	for _, bucket := range buckets {
		if bucket.Count > maxCount {
			maxCount = bucket.Count
		}
	}

	if maxCount == 0 {
		b.WriteString(styles.CardStyle.Width(cardWidth).Render(
			styles.MutedStyle.Render("No requests in period"),
		))
		return b.String()
	}

	// Show last 8 buckets as horizontal bars
	startIdx := len(buckets) - 8
	if startIdx < 0 {
		startIdx = 0
	}

	barWidth := cardWidth - 20
	if barWidth > 40 {
		barWidth = 40
	}

	for i := startIdx; i < len(buckets); i++ {
		bucket := buckets[i]
		timeLabel := bucket.Time.Format("15:04")
		percentage := float64(bucket.Count) / float64(maxCount)

		bar := renderProgressBar(percentage, barWidth, false)
		line := fmt.Sprintf("%s  %4d  %s", timeLabel, bucket.Count, bar)

		b.WriteString(styles.CardStyle.Width(cardWidth).Render(line))
		b.WriteString("\n")
	}

	return b.String()
}