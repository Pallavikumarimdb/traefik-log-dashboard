package period

import (
	"time"
)

// Period represents a time period
type Period struct {
	Start time.Time
	End   time.Time
}

// NewPeriod creates a new Period
func NewPeriod(start, end time.Time) Period {
	return Period{Start: start, End: end}
}

// Duration returns the duration of the period
func (p Period) Duration() time.Duration {
	return p.End.Sub(p.Start)
}

// Contains checks if a time is within the period
func (p Period) Contains(t time.Time) bool {
	return t.After(p.Start) && t.Before(p.End)
}

// LastHour returns a period for the last hour
func LastHour() Period {
	now := time.Now()
	return Period{
		Start: now.Add(-1 * time.Hour),
		End:   now,
	}
}

// Last24Hours returns a period for the last 24 hours
func Last24Hours() Period {
	now := time.Now()
	return Period{
		Start: now.Add(-24 * time.Hour),
		End:   now,
	}
}

// LastWeek returns a period for the last 7 days
func LastWeek() Period {
	now := time.Now()
	return Period{
		Start: now.Add(-7 * 24 * time.Hour),
		End:   now,
	}
}

// LastMonth returns a period for the last 30 days
func LastMonth() Period {
	now := time.Now()
	return Period{
		Start: now.Add(-30 * 24 * time.Hour),
		End:   now,
	}
}

// Today returns a period for today (midnight to now)
func Today() Period {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return Period{
		Start: start,
		End:   now,
	}
}

// Yesterday returns a period for yesterday
func Yesterday() Period {
	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)
	start := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 0, 0, 0, 0, yesterday.Location())
	end := time.Date(yesterday.Year(), yesterday.Month(), yesterday.Day(), 23, 59, 59, 999999999, yesterday.Location())
	return Period{
		Start: start,
		End:   end,
	}
}

// ThisWeek returns a period for this week (Monday to now)
func ThisWeek() Period {
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7 // Sunday is 0, make it 7
	}
	daysFromMonday := weekday - 1
	monday := now.Add(-time.Duration(daysFromMonday) * 24 * time.Hour)
	start := time.Date(monday.Year(), monday.Month(), monday.Day(), 0, 0, 0, 0, monday.Location())
	return Period{
		Start: start,
		End:   now,
	}
}

// ThisMonth returns a period for this month (1st to now)
func ThisMonth() Period {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	return Period{
		Start: start,
		End:   now,
	}
}

// Custom creates a custom period
func Custom(start, end time.Time) Period {
	return Period{Start: start, End: end}
}