package sqlite

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/gabehf/koito/internal/db"
)

func (s *Sqlite) CountListens(ctx context.Context, timeframe db.Timeframe) (int64, error) {
	t1, t2 := db.TimeframeToTimeRange(timeframe)
	var count int64
	err := s.db.QueryRowContext(ctx,
		`SELECT COUNT(*) FROM listens WHERE listened_at BETWEEN ? AND ?`,
		t1.Unix(), t2.Unix()).Scan(&count)
	return count, err
}

func (s *Sqlite) CountListensByHour(ctx context.Context, timeframe db.Timeframe) ([24]int64, error) {
	from, to := db.TimeframeToTimeRange(timeframe)
	location := timeframe.Timezone
	if location == nil {
		location = time.UTC
	}
	var counts [24]int64
	rows, err := s.db.QueryContext(ctx,
		`SELECT listened_at FROM listens WHERE listened_at BETWEEN ? AND ?`,
		from.Unix(), to.Unix())
	if err != nil {
		return counts, err
	}
	defer rows.Close()

	for rows.Next() {
		var timestamp int64
		if err := rows.Scan(&timestamp); err != nil {
			return [24]int64{}, err
		}
		// Convert each timestamp before grouping so fractional UTC offsets and
		// both occurrences of a repeated local hour are counted correctly.
		hour := time.Unix(timestamp, 0).In(location).Hour()
		counts[hour]++
	}
	return counts, rows.Err()
}

func (s *Sqlite) CountListensToItem(ctx context.Context, opts db.TimeListenedOpts) (int64, error) {
	t1, t2 := db.TimeframeToTimeRange(opts.Timeframe)
	var count int64
	var err error
	switch {
	case opts.ArtistID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM listens l
			JOIN artist_tracks at2 ON l.track_id = at2.track_id
			WHERE l.listened_at BETWEEN ? AND ? AND at2.artist_id = ?`,
			t1.Unix(), t2.Unix(), opts.ArtistID).Scan(&count)
	case opts.AlbumID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM listens l
			JOIN tracks t ON l.track_id = t.id
			WHERE l.listened_at BETWEEN ? AND ? AND t.release_id = ?`,
			t1.Unix(), t2.Unix(), opts.AlbumID).Scan(&count)
	case opts.TrackID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COUNT(*) FROM listens
			WHERE listened_at BETWEEN ? AND ? AND track_id = ?`,
			t1.Unix(), t2.Unix(), opts.TrackID).Scan(&count)
	default:
		return 0, errors.New("CountListensToItem: an id must be provided")
	}
	if err != nil {
		return 0, fmt.Errorf("CountListensToItem: %w", err)
	}
	return count, nil
}

func (s *Sqlite) CountTimeListened(ctx context.Context, timeframe db.Timeframe) (int64, error) {
	t1, t2 := db.TimeframeToTimeRange(timeframe)
	var seconds int64
	err := s.db.QueryRowContext(ctx, `
		SELECT COALESCE(SUM(t.duration), 0)
		FROM listens l JOIN tracks t ON l.track_id = t.id
		WHERE l.listened_at BETWEEN ? AND ?`,
		t1.Unix(), t2.Unix()).Scan(&seconds)
	return seconds, err
}

func (s *Sqlite) CountTimeListenedToItem(ctx context.Context, opts db.TimeListenedOpts) (int64, error) {
	t1, t2 := db.TimeframeToTimeRange(opts.Timeframe)
	var seconds int64
	var err error
	switch {
	case opts.ArtistID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COALESCE(SUM(t.duration), 0)
			FROM listens l JOIN tracks t ON l.track_id = t.id
			JOIN artist_tracks at2 ON t.id = at2.track_id
			WHERE l.listened_at BETWEEN ? AND ? AND at2.artist_id = ?`,
			t1.Unix(), t2.Unix(), opts.ArtistID).Scan(&seconds)
	case opts.AlbumID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COALESCE(SUM(t.duration), 0)
			FROM listens l JOIN tracks t ON l.track_id = t.id
			WHERE l.listened_at BETWEEN ? AND ? AND t.release_id = ?`,
			t1.Unix(), t2.Unix(), opts.AlbumID).Scan(&seconds)
	case opts.TrackID > 0:
		err = s.db.QueryRowContext(ctx, `
			SELECT COALESCE(SUM(t.duration), 0)
			FROM listens l JOIN tracks t ON l.track_id = t.id
			WHERE l.listened_at BETWEEN ? AND ? AND t.id = ?`,
			t1.Unix(), t2.Unix(), opts.TrackID).Scan(&seconds)
	default:
		return 0, errors.New("CountTimeListenedToItem: an id must be provided")
	}
	if err != nil {
		return 0, fmt.Errorf("CountTimeListenedToItem: %w", err)
	}
	return seconds, nil
}
