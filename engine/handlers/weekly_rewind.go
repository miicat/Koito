package handlers

import (
	"context"
	"errors"
	"time"

	"github.com/gabehf/koito/internal/db"
)

type rewindWeek struct {
	start       time.Time // UTC calendar date, localized when querying listens
	latestStart time.Time
	location    *time.Location
}

type weeklyRewind struct {
	Start       string            `json:"start"`
	StartsAt    time.Time         `json:"starts_at"`
	LatestStart string            `json:"latest_start"`
	Days        [7]weeklyPlaysDay `json:"days"`
	HourlyPlays [24]int64         `json:"hourly_plays"`
}

type weeklyPlaysDay struct {
	Date          string `json:"date"`
	Plays         int64  `json:"plays"`
	PreviousPlays int64  `json:"previous_plays"`
}

type listenCounter interface {
	CountListens(context.Context, db.Timeframe) (int64, error)
}

func resolveRewindWeek(value string, now time.Time, location *time.Location) (rewindWeek, error) {
	today := localCalendarDate(now, location)
	daysSinceFriday := (int(today.Weekday()) - int(time.Friday) + 7) % 7
	latest := today.AddDate(0, 0, -daysSinceFriday-7)
	week := rewindWeek{start: latest, latestStart: latest, location: location}
	if value == "latest" {
		return week, nil
	}

	start, err := time.Parse(time.DateOnly, value)
	if err != nil || start.Weekday() != time.Friday || start.Format(time.DateOnly) != value {
		return rewindWeek{}, errors.New("week_start must be latest or a Friday in YYYY-MM-DD format")
	}
	if start.After(latest) {
		return rewindWeek{}, errors.New("week_start must be in a completed week")
	}
	week.start = start
	return week, nil
}

func (week rewindWeek) timeframe(day time.Time, days int) db.Timeframe {
	return rewindTimeframe(day, days, week.location)
}

func (week rewindWeek) comparison(ctx context.Context, store listenCounter) (weeklyRewind, error) {
	result := weeklyRewind{
		Start:       week.start.Format(time.DateOnly),
		StartsAt:    localDayStart(week.start, week.location),
		LatestStart: week.latestStart.Format(time.DateOnly),
	}
	for i := range result.Days {
		day := week.start.AddDate(0, 0, i)
		plays, err := store.CountListens(ctx, week.timeframe(day, 1))
		if err != nil {
			return weeklyRewind{}, err
		}
		previousPlays, err := store.CountListens(ctx, week.timeframe(day.AddDate(0, 0, -7), 1))
		if err != nil {
			return weeklyRewind{}, err
		}
		result.Days[i] = weeklyPlaysDay{
			Date:          day.Format(time.DateOnly),
			Plays:         plays,
			PreviousPlays: previousPlays,
		}
	}
	return result, nil
}
