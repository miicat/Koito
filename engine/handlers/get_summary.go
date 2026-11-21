package handlers

import (
	"net/http"
	"time"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/summary"
	"github.com/gabehf/koito/internal/utils"
)

type summaryHandlerStore interface {
	db.ArtistStore
	db.AlbumStore
	db.TrackStore
	db.ListenStore
}

func SummaryHandler(store summaryHandlerStore) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		l.Debug().Msg("SummaryHandler: Received request to retrieve summary")
		timeframe := TimeframeFromRequest(r)
		query := r.URL.Query()
		var day rewindDay
		var week rewindWeek
		if query.Has("day") {
			if query.Has("week_start") {
				utils.WriteError(w, "day and week_start are mutually exclusive", http.StatusBadRequest)
				return
			}
			var err error
			day, err = resolveRewindDay(query.Get("day"), time.Now(), timeframe.Timezone)
			if err != nil {
				utils.WriteError(w, err.Error(), http.StatusBadRequest)
				return
			}
			timeframe = day.timeframe()
		} else if query.Has("week_start") {
			var err error
			week, err = resolveRewindWeek(query.Get("week_start"), time.Now(), timeframe.Timezone)
			if err != nil {
				utils.WriteError(w, err.Error(), http.StatusBadRequest)
				return
			}
			timeframe = week.timeframe(week.start, 7)
		}

		stats, err := summary.GenerateSummary(ctx, store, 1, timeframe, "")
		if err != nil {
			l.Err(err).Int("userid", 1).Any("timeframe", timeframe).Msgf("SummaryHandler: Failed to generate summary")
			utils.WriteError(w, "failed to generate summary", http.StatusInternalServerError)
			return
		}

		if day.location != nil {
			daily, err := day.details(ctx, store)
			if err != nil {
				l.Err(err).Msg("SummaryHandler: Failed to load daily listening details")
				utils.WriteError(w, "failed to generate daily Rewind", http.StatusInternalServerError)
				return
			}
			utils.WriteJSON(w, http.StatusOK, struct {
				*summary.Summary
				Daily dailyRewind `json:"daily"`
			}{stats, daily})
			return
		}

		if week.location == nil {
			utils.WriteJSON(w, http.StatusOK, stats)
			return
		}

		weekly, err := week.comparison(ctx, store)
		if err != nil {
			l.Err(err).Msg("SummaryHandler: Failed to count daily plays")
			utils.WriteError(w, "failed to generate weekly comparison", http.StatusInternalServerError)
			return
		}
		weekly.HourlyPlays, err = store.CountListensByHour(ctx, timeframe)
		if err != nil {
			l.Err(err).Msg("SummaryHandler: Failed to count hourly plays")
			utils.WriteError(w, "failed to generate listening clock", http.StatusInternalServerError)
			return
		}
		utils.WriteJSON(w, http.StatusOK, struct {
			*summary.Summary
			Weekly weeklyRewind `json:"weekly"`
		}{stats, weekly})
	}
}
