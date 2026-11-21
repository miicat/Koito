package handlers

import (
	"time"

	"github.com/gabehf/koito/internal/db"
)

func localCalendarDate(now time.Time, location *time.Location) time.Time {
	year, month, day := now.In(location).Date()
	return time.Date(year, month, day, 0, 0, 0, 0, time.UTC)
}

// Find the first instant of the calendar day, including when a timezone skips
// or repeats midnight. The search starts before midnight in any timezone.
func localDayStart(day time.Time, location *time.Location) time.Time {
	for probe := day.Add(-24 * time.Hour).In(location); ; {
		_, offset := probe.Zone()
		start := day.Add(-time.Duration(offset) * time.Second)
		if start.Before(probe) {
			start = probe
		}
		_, zoneEnd := probe.ZoneBounds()
		if zoneEnd.IsZero() || start.Before(zoneEnd) {
			return start.In(location)
		}
		probe = zoneEnd
	}
}

func rewindTimeframe(day time.Time, days int, location *time.Location) db.Timeframe {
	from := localDayStart(day, location)
	// Listen counts use inclusive Unix-second bounds.
	to := localDayStart(day.AddDate(0, 0, days), location).Add(-time.Second)
	// The time.Time zero value is also midnight UTC on 0001-01-01.
	if from.IsZero() || to.IsZero() {
		return db.Timeframe{FromUnix: from.Unix(), ToUnix: to.Unix(), Timezone: location}
	}
	return db.Timeframe{From: from, To: to, Timezone: location}
}
