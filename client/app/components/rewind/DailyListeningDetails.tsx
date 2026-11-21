import type { DailyRewind, Listen, RewindStats } from "api/api";
import { Link } from "react-router";
import ArtistLinks from "../ArtistLinks";
import {
  formatCount,
  formatHour,
  formatListeningTime,
  formatPlays,
} from "./format";
import ListeningClock from "./ListeningClock";

const reportDate = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const weekday = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  timeZone: "UTC",
});
const number = new Intl.NumberFormat();

function HourlyListens({ hour, listens }: { hour: number; listens: Listen[] }) {
  return (
    <div className="mt-4 rounded-(--border-radius) border border-(--color-bg-tertiary) px-4 py-3">
      <h3 className="font-semibold tabular-nums" aria-live="polite">
        {formatHour(hour)}–{formatHour(hour + 1)} · {formatPlays(listens.length)}
      </h3>
      {listens.length > 0 ? (
        <ol className="mt-2 max-h-64 divide-y divide-(--color-bg-tertiary) overflow-y-auto">
          {listens.map(({ time, track }) => (
            <li
              key={`${track.id}/${time}`}
              className="flex items-start gap-3 py-2 text-sm"
            >
              <time dateTime={time} className="tabular-nums color-fg-tertiary">
                {time.slice(11, 16)}
              </time>
              <div className="min-w-0 wrap-break-word">
                <Link to={`/track/${track.id}`} className="font-medium hover:underline">
                  {track.title}
                </Link>
                {track.artists?.length > 0 && (
                  <div>
                    <ArtistLinks artists={track.artists} />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 text-sm color-fg-secondary">No tracks played in this hour.</p>
      )}
    </div>
  );
}

export function FirstTimeListens({ tracks, artists }: { tracks: number; artists: number }) {
  const newItems = [
    tracks && formatCount(tracks, "track"),
    artists && formatCount(artists, "artist"),
  ]
    .filter(Boolean)
    .join(" and ");

  return (
    <section>
      <h2 className="mb-1 text-2xl!">First-time listens</h2>
      <p className="color-fg-secondary">
        {newItems
          ? `${newItems} appeared in your Koito history for the first time.`
          : "No first-time tracks or artists."}
      </p>
    </section>
  );
}

export default function DailyListeningDetails({
  daily,
  stats,
}: {
  daily: DailyRewind;
  stats: RewindStats;
}) {
  const date = new Date(`${daily.date}T00:00:00Z`);
  const previousDate = new Date(date);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);
  const previousDay = weekday.format(previousDate);
  const difference = stats.plays - daily.previous_plays;
  const change = Math.abs(difference);
  const comparison =
    difference === 0
      ? `The same number of plays as ${previousDay}.`
      : `${number.format(change)} ${difference > 0 ? "more" : "fewer"} ${change === 1 ? "play" : "plays"} than ${previousDay}.`;

  return (
    <>
      <section aria-label="Daily listening totals">
        <time dateTime={daily.date} className="color-fg-secondary">{reportDate.format(date)}</time>
        <dl className="mt-4 grid grid-cols-[1fr_1.5fr_1fr] gap-2 text-sm sm:grid-cols-3 sm:gap-4">
          <div className="flex flex-col">
            <dt className="color-fg-secondary">Plays</dt>
            <dd className="order-first text-xl font-semibold">{number.format(stats.plays)}</dd>
          </div>
          <div className="flex flex-col">
            <dt className="color-fg-secondary">Known listening time</dt>
            <dd className="order-first text-xl font-semibold">
              {formatListeningTime(stats.minutes_listened)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="color-fg-secondary">Unique tracks</dt>
            <dd className="order-first text-xl font-semibold">
              {number.format(stats.unique_tracks)}
            </dd>
          </div>
        </dl>
        <p className="mt-3 text-sm color-fg-secondary">{comparison}</p>
      </section>
      {stats.plays > 0 ? (
        <ListeningClock
          key={daily.date}
          hours={daily.hourly_listens.map((listens) => listens?.length ?? 0)}
          renderHour={(hour) => (
            <HourlyListens hour={hour} listens={daily.hourly_listens[hour] ?? []} />
          )}
        />
      ) : (
        <p className="color-fg-secondary">No plays on this day.</p>
      )}
    </>
  );
}
