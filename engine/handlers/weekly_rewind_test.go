package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gabehf/koito/internal/cfg"
	"github.com/gabehf/koito/internal/db"
	"github.com/stretchr/testify/require"
)

func TestResolveRewindWeekAtFridayRollover(t *testing.T) {
	location, err := time.LoadLocation("Europe/Helsinki")
	require.NoError(t, err)
	friday := time.Date(2026, time.January, 2, 0, 0, 0, 0, location).UTC()

	before, err := resolveRewindWeek("latest", friday.Add(-time.Second), location)
	require.NoError(t, err)
	require.Equal(t, "2025-12-19", before.start.Format(time.DateOnly))

	latest, err := resolveRewindWeek("latest", friday, location)
	require.NoError(t, err)
	require.Equal(t, "2025-12-26", latest.start.Format(time.DateOnly))
	require.Equal(t, friday.Add(-time.Second), latest.timeframe(latest.start, 7).To.UTC())

	historical, err := resolveRewindWeek("2025-12-19", friday, location)
	require.NoError(t, err)
	require.Equal(t, before.start, historical.start)
	require.Equal(t, latest.start, historical.latestStart)

	for _, value := range []string{"", "2025-2-07", "2025-12-32", "2025-12-25", "2026-01-02", "2026-01-09"} {
		t.Run(value, func(t *testing.T) {
			_, err := resolveRewindWeek(value, friday, location)
			require.Error(t, err)
		})
	}
}

func TestRewindWeekCalendarBoundaries(t *testing.T) {
	now := time.Date(2026, time.November, 20, 0, 0, 0, 0, time.UTC)
	for _, tc := range []struct {
		zone, start, transitionDate string
		hours                       int
		transitionStart             string
	}{
		{"Europe/Helsinki", "2026-03-27", "2026-03-29", 167, "2026-03-28T22:00:00Z"},
		{"Europe/Helsinki", "2026-10-23", "2026-10-25", 169, "2026-10-24T21:00:00Z"},
		{"Africa/Cairo", "2024-04-26", "2024-04-26", 167, "2024-04-25T22:00:00Z"},
		{"America/Havana", "2024-11-01", "2024-11-03", 169, "2024-11-03T04:00:00Z"},
	} {
		t.Run(tc.zone+"/"+tc.start, func(t *testing.T) {
			location, err := time.LoadLocation(tc.zone)
			require.NoError(t, err)
			week, err := resolveRewindWeek(tc.start, now, location)
			require.NoError(t, err)
			period := week.timeframe(week.start, 7)
			require.Equal(t, time.Duration(tc.hours)*time.Hour, period.To.Sub(period.From)+time.Second)

			day, err := time.Parse(time.DateOnly, tc.transitionDate)
			require.NoError(t, err)
			require.Equal(t, tc.transitionStart, week.timeframe(day, 1).From.UTC().Format(time.RFC3339))
		})
	}
}

type testListens []time.Time

func (listens testListens) CountListens(_ context.Context, timeframe db.Timeframe) (int64, error) {
	from, to := db.TimeframeToTimeRange(timeframe)
	var count int64
	for _, listen := range listens {
		if !listen.Before(from) && !listen.After(to) {
			count++
		}
	}
	return count, nil
}

func TestWeeklyRewindComparison(t *testing.T) {
	location, err := time.LoadLocation("Asia/Kolkata")
	require.NoError(t, err)
	now := time.Date(2026, time.January, 10, 12, 0, 0, 0, location)
	week, err := resolveRewindWeek("2025-12-26", now, location)
	require.NoError(t, err)
	start := time.Date(2025, time.December, 26, 0, 0, 0, 0, location)
	previousStart := start.AddDate(0, 0, -7)
	nextStart := start.AddDate(0, 0, 7)
	days, err := week.comparison(t.Context(), testListens{
		previousStart.Add(-time.Second), // outside both weeks
		previousStart,
		start.Add(-time.Second),
		start,
		nextStart.Add(-time.Second),
		nextStart, // outside the selected week
	})
	require.NoError(t, err)
	require.Equal(t, "2025-12-26", days.Start)
	require.Equal(t, "2026-01-02", days.LatestStart)
	require.True(t, days.StartsAt.Equal(start))
	require.Equal(t, [7]weeklyPlaysDay{
		{Date: "2025-12-26", Plays: 1, PreviousPlays: 1},
		{Date: "2025-12-27"},
		{Date: "2025-12-28"},
		{Date: "2025-12-29"},
		{Date: "2025-12-30"},
		{Date: "2025-12-31"},
		{Date: "2026-01-01", Plays: 1, PreviousPlays: 1},
	}, days.Days)

	empty, err := week.comparison(t.Context(), testListens(nil))
	require.NoError(t, err)
	for _, day := range empty.Days {
		require.Zero(t, day.Plays)
		require.Zero(t, day.PreviousPlays)
	}
}

func TestSummaryRejectsInvalidWeekStart(t *testing.T) {
	require.NoError(t, cfg.Load(func(string) string { return "" }, "test"))

	for _, query := range []string{"week_start=", "week_start=2026-11-19", "week_start=9999-12-31"} {
		t.Run(query, func(t *testing.T) {
			writer := httptest.NewRecorder()
			SummaryHandler(nil).ServeHTTP(writer, httptest.NewRequest(http.MethodGet, "/apis/web/v1/summary?"+query, nil))
			require.Equal(t, http.StatusBadRequest, writer.Code)
		})
	}
}
