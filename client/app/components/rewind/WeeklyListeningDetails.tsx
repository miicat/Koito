import type { WeeklyRewind } from "api/api";
import ListeningClock from "./ListeningClock";
import { formatListeningTime, formatPlays } from "./format";

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
type Props = {
  weekly: WeeklyRewind;
  minutesListened: number;
  avgPlaysPerDay: number;
};

export default function WeeklyListeningDetails({
  weekly,
  minutesListened,
  avgPlaysPerDay,
}: Props) {
  const busiestDay = weekly.days.reduce((peak, day) =>
    day.plays > peak.plays ? day : peak,
  );

  return (
    <>
      <ListeningClock key={weekly.start} hours={weekly.hourly_plays} />
      <section aria-label="Quick Facts" className="min-w-0">
        <h2 className="mb-4 text-2xl!">Quick Facts</h2>
        <dl className="grid grid-cols-3 gap-2 text-sm sm:gap-4">
          <div>
            <dt className="color-fg-secondary">Known listening time</dt>
            <dd className="text-xl font-semibold">{formatListeningTime(minutesListened)}</dd>
          </div>
          <div>
            <dt className="color-fg-secondary">Average plays per day</dt>
            <dd className="text-xl font-semibold">{avgPlaysPerDay.toFixed(1)}</dd>
          </div>
          <div>
            <dt className="color-fg-secondary">Busiest day</dt>
            {busiestDay.plays > 0 ? (
              <>
                <dd className="text-xl font-semibold">
                  {dayFormat.format(new Date(`${busiestDay.date}T00:00:00Z`))}
                </dd>
                <dd className="color-fg-secondary">{formatPlays(busiestDay.plays)}</dd>
              </>
            ) : (
              <dd className="text-xl font-semibold">No plays</dd>
            )}
          </div>
        </dl>
      </section>
    </>
  );
}
