package sqlite_test

import (
	"testing"
	"time"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/db/sqlite"
	"github.com/stretchr/testify/require"
)

func TestCountListensByHour(t *testing.T) {
	for _, test := range []struct {
		name, timezone string
		start, end     string
		timestamps     []string
		want           [24]int64
	}{
		{
			name:     "local hours with a half hour offset",
			timezone: "Asia/Kolkata",
			start:    "2026-01-01T18:30:00Z",
			end:      "2026-01-02T18:29:59Z",
			timestamps: []string{
				"2026-01-01T18:29:59Z", // outside report
				"2026-01-01T18:30:00Z", // local midnight
				"2026-01-01T19:29:59Z", // local 00:59:59
				"2026-01-01T19:30:00Z", // local 01:00
				"2026-01-02T18:29:59Z", // local 23:59:59
				"2026-01-02T18:30:00Z", // outside report
			},
			want: [24]int64{0: 2, 1: 1, 23: 1},
		},
		{
			name:     "both occurrences of a repeated hour",
			timezone: "America/New_York",
			start:    "2026-11-01T04:00:00Z",
			end:      "2026-11-02T04:59:59Z",
			timestamps: []string{
				"2026-11-01T05:30:00Z", // local 01:30 EDT
				"2026-11-01T06:30:00Z", // local 01:30 EST
				"2026-11-01T07:30:00Z", // local 02:30 EST
			},
			want: [24]int64{1: 2, 2: 1},
		},
	} {
		t.Run(test.name, func(t *testing.T) {
			store, err := sqlite.NewInMemory()
			require.NoError(t, err)
			t.Cleanup(func() { store.Close(t.Context()) })
			require.NoError(t, store.Exec(`
				INSERT INTO releases (id) VALUES (1);
				INSERT INTO tracks (id, release_id) VALUES (1, 1);
				INSERT INTO users (id, username, password) VALUES (1, 'fixture', X'00');
			`))
			for _, value := range test.timestamps {
				timestamp, err := time.Parse(time.RFC3339, value)
				require.NoError(t, err)
				require.NoError(t, store.Exec(`INSERT INTO listens (track_id, listened_at, user_id) VALUES (1, ?, 1)`, timestamp.Unix()))
			}

			location, err := time.LoadLocation(test.timezone)
			require.NoError(t, err)
			start, err := time.Parse(time.RFC3339, test.start)
			require.NoError(t, err)
			end, err := time.Parse(time.RFC3339, test.end)
			require.NoError(t, err)
			counts, err := store.CountListensByHour(t.Context(), db.Timeframe{
				From:     start,
				To:       end,
				Timezone: location,
			})
			require.NoError(t, err)
			require.Equal(t, test.want, counts)
		})
	}
}
