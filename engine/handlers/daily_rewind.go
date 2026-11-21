package handlers

import (
	"context"
	"errors"
	"time"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/models"
)

type rewindDay struct {
	date     time.Time // UTC calendar date, localized when querying listens
	latest   time.Time
	location *time.Location
}

type dailyRewind struct {
	Date          string              `json:"date"`
	LatestDate    string              `json:"latest_date"`
	PreviousPlays int64               `json:"previous_plays"`
	HourlyListens [24][]models.Listen `json:"hourly_listens"`
}

func resolveRewindDay(value string, now time.Time, location *time.Location) (rewindDay, error) {
	latest := localCalendarDate(now, location).AddDate(0, 0, -1)
	if value == "latest" {
		return rewindDay{date: latest, latest: latest, location: location}, nil
	}
	date, err := time.Parse(time.DateOnly, value)
	if err != nil || date.Year() < 1 || date.Format(time.DateOnly) != value {
		return rewindDay{}, errors.New("day must be latest or a date in YYYY-MM-DD format")
	}
	if date.After(latest) {
		return rewindDay{}, errors.New("day must be a completed day")
	}
	return rewindDay{date: date, latest: latest, location: location}, nil
}

func (day rewindDay) timeframe() db.Timeframe {
	return rewindTimeframe(day.date, 1, day.location)
}

func (day rewindDay) details(ctx context.Context, store db.ListenStore) (dailyRewind, error) {
	previous := rewindTimeframe(day.date.AddDate(0, 0, -1), 1, day.location)
	previousPlays, err := store.CountListens(ctx, previous)
	if err != nil {
		return dailyRewind{}, err
	}
	result := dailyRewind{
		Date:          day.date.Format(time.DateOnly),
		LatestDate:    day.latest.Format(time.DateOnly),
		PreviousPlays: previousPlays,
	}
	opts := db.GetItemsOpts{Page: 1, Limit: maximumLimit, Timeframe: day.timeframe()}
	for {
		listens, err := store.GetListensPaginated(ctx, opts)
		if err != nil {
			return dailyRewind{}, err
		}
		for _, listen := range listens.Items {
			localTime := listen.Time.In(day.location)
			hour := localTime.Hour()
			result.HourlyListens[hour] = append(result.HourlyListens[hour], models.Listen{
				Time: localTime, Track: listen.Track,
			})
		}
		if !listens.HasNextPage || len(listens.Items) == 0 {
			return result, nil
		}
		opts.Page++
	}
}
