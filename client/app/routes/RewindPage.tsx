import Rewind from "~/components/rewind/Rewind";
import { type RewindStats } from "api/api";
import { useState } from "react";
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useLocation, useNavigate } from "react-router";
import { getRewindParams } from "~/utils/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "~/providers/AppProvider";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekDateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const earliestDay = "0001-01-01";
const dateArrowClass =
  "p-2 rounded-(--border-radius) enabled:hover:bg-(--color-bg-secondary) disabled:opacity-35";

function addDays(date: string, days: number): string {
  const day = new Date(`${date}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + days);
  return day.toISOString().slice(0, 10);
}

const parseParams = (
  params: URLSearchParams,
): { year: number; month?: number } => {
  const rawYear = params.get("year");
  const rawMonth = params.get("month");

  if (!rawYear && !rawMonth) return getRewindParams();
  if (rawYear && rawMonth)
    return { year: parseInt(rawYear), month: parseInt(rawMonth) };
  if (rawYear) return { year: parseInt(rawYear) };

  const month = parseInt(rawMonth!);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return { year: month <= currentMonth ? currentYear : currentYear - 1, month };
};

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const params = new URL(request.url).searchParams;
  const day = params.get("day");
  const weekStart = params.get("week_start");
  if (
    day !== null || weekStart !== null || (!params.has("year") && !params.has("month"))
  ) {
    const period = day !== null ? "Daily" : "Weekly";
    const query = new URLSearchParams(
      day !== null ? { day } : { week_start: weekStart ?? "latest" },
    );
    const res = await fetch(`/apis/web/v1/summary?${query}`, {
      signal: request.signal,
    });
    if (!res.ok) {
      throw new Response(null, {
        status: res.status,
        statusText:
          res.status === 400
            ? `Invalid ${period.toLowerCase()} Rewind date`
            : `Failed to load ${period.toLowerCase()} Rewind`,
      });
    }

    const stats: RewindStats = await res.json();
    stats.title = `Your ${period} Rewind`;
    return { stats };
  }

  const { year, month } = parseParams(params);
  const res = await fetch(`/apis/web/v1/summary?year=${year}&month=${month}`, {
    signal: request.signal,
  });
  if (!res.ok) throw new Response("Failed to load summary", { status: 500 });

  const stats: RewindStats = await res.json();
  stats.title = `Your ${month && month > 0 ? months[month - 1] : ""} ${year} Rewind`;
  return { stats };
}

export default function RewindPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { stats } = useLoaderData<{ stats: RewindStats }>();
  const { firstActivity } = useAppContext();
  const { daily, weekly } = stats;
  const showCalendar = !daily && !weekly;

  const { year: loadedYear, month } = parseParams(
    new URLSearchParams(location.search),
  );
  const [calendarView, setCalendarView] = useState<{
    locationKey: string;
    year: number;
    showYearly: boolean;
  }>();
  const currentView =
    calendarView?.locationKey === location.key ? calendarView : undefined;
  const year = currentView?.year ?? loadedYear;
  const showYearly = currentView?.showYearly ?? !month;
  const [showTime, setShowTime] = useState(false);

  const navigateRewind = (params: Record<string, string>) => {
    navigate(`/rewind?${new URLSearchParams(params)}`);
  };

  const navigateMonth = (newMonth: number) => {
    navigateRewind({ year: year.toString(), month: newMonth.toString() });
  };

  const navigateYear = (direction: "prev" | "next") => {
    setCalendarView({
      locationKey: location.key,
      year: direction === "next" ? year + 1 : year - 1,
      showYearly,
    });
  };

  const selectCalendarView = (yearly: boolean) => {
    if (showCalendar) {
      setCalendarView({ locationKey: location.key, year, showYearly: yearly });
      return;
    }
    const now = new Date();
    if (yearly) {
      navigateRewind({ year: String(now.getFullYear() - 1) });
    } else {
      const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      navigateRewind({
        year: String(previousMonth.getFullYear()),
        month: String(previousMonth.getMonth() + 1),
      });
    }
  };

  // month is 0-indexed (array index), matching JS Date convention
  function isFuture(month: number, year: number) {
    return new Date(year, month + 1) > new Date();
  }

  function isBeforeFirstActivity(month: number, year: number) {
    return !!firstActivity && new Date(year, month + 1) < firstActivity;
  }

  function isUnavailable(monthIndex: number, year: number) {
    return (
      isFuture(monthIndex, year) || isBeforeFirstActivity(monthIndex, year)
    );
  }

  const pgTitle = `${stats.title} - Koito`;
  const weekRange =
    weekly &&
    weekDateFormat.formatRange(
      new Date(`${weekly.start}T00:00:00Z`),
      new Date(`${addDays(weekly.start, 6)}T00:00:00Z`),
    );

  return (
    <div className="w-full min-h-screen">
      <title>{pgTitle}</title>
      <meta property="og:title" content={pgTitle} />
      <meta name="description" content={pgTitle} />
      <div
        className={`flex flex-col lg:flex-row items-center lg:items-start lg:mt-15 mt-5 w-19/20 mx-auto ${
          showCalendar ? "gap-10 px-5 md:px-10" : "gap-4 px-1 sm:gap-10 sm:px-5 md:px-10"
        }`}
      >
        <div className="flex flex-col items-start gap-4">
          <div className="flex flex-col items-center gap-4 mt-4 sm:mt-14 w-[250px] mx-auto">
            {showCalendar && !showYearly && (
              <>
                <div className="flex items-center gap-6 justify-around">
                  <button
                    onClick={() => navigateYear("prev")}
                    className="p-2 disabled:opacity-0"
                    disabled={
                      new Date(year - 1, month || 0) > new Date() ||
                      (firstActivity && year - 1 < firstActivity.getFullYear())
                    }
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <p className="font-medium text-xl text-center w-30">{year}</p>
                  <button
                    onClick={() => navigateYear("next")}
                    className="p-2 disabled:opacity-0"
                    disabled={isFuture(0, year + 1)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {months.map((m, i) => {
                    const isSelected =
                      month !== undefined &&
                      i === month - 1 &&
                      loadedYear === year;
                    const unavailable = isUnavailable(i, year);
                    return (
                      <button
                        key={m}
                        className={`px-12 py-2 rounded-(--border-radius)
                          ${isSelected ? "card" : "border-1 border-(--color-bg)"}
                          ${unavailable ? "color-fg-tertiary" : "hover:bg-(--color-bg-secondary)"}
                        `}
                        onClick={() => navigateMonth(i + 1)}
                        disabled={unavailable || isSelected}
                      >
                        {m.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
            {showCalendar && showYearly && firstActivity && (
              <div className="grid grid-cols-2 gap-2">
                {Array.from(
                  {
                    length:
                      new Date().getFullYear() - firstActivity.getFullYear(),
                  },
                  (_, index) => firstActivity.getFullYear() + index,
                ).map((y) => (
                  <button
                    key={y}
                    className={`px-10 py-2 rounded-(--border-radius) hover:bg-(--color-bg-secondary)
                      ${y === year && !month ? "card" : "border-1 border-(--color-bg)"}
                    `}
                    onClick={() => navigateRewind({ year: y.toString() })}
                    disabled={(!month || month === 0) && y === year}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                id="show-time-checkbox"
                type="checkbox"
                checked={showTime}
                onChange={(e) => setShowTime(e.target.checked)}
              />
              <label htmlFor="show-time-checkbox">Show time listened?</label>
            </div>
          </div>
        </div>
        <div
          className={`flex flex-col items-center gap-4 ${showCalendar ? "" : "w-full min-w-0 max-w-3xl"}`}
        >
          <div
            aria-label="Rewind period"
            role="group"
            className="flex justify-around gap-2 sm:gap-4 mb-4 w-full max-w-sm text-sm sm:text-base"
          >
            <button
              className="period-selector"
              onClick={() => navigateRewind({ day: "latest" })}
              aria-pressed={!!daily}
              disabled={!!daily}
            >
              DAILY
            </button>
            <button
              className="period-selector"
              onClick={() => navigateRewind({ week_start: "latest" })}
              aria-pressed={!!weekly}
              disabled={!!weekly}
            >
              WEEKLY
            </button>
            <button
              className="period-selector"
              onClick={() => selectCalendarView(false)}
              aria-pressed={showCalendar && !showYearly}
              disabled={showCalendar && !showYearly}
            >
              MONTHLY
            </button>
            <button
              className="period-selector"
              onClick={() => selectCalendarView(true)}
              aria-pressed={showCalendar && showYearly}
              disabled={showCalendar && showYearly}
            >
              YEARLY
            </button>
          </div>
          {daily && (
            <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-3">
              <button
                aria-label="Previous day"
                className={dateArrowClass}
                onClick={() => navigateRewind({ day: addDays(daily.date, -1) })}
                disabled={daily.date === earliestDay}
              >
                <ChevronLeft size={20} />
              </button>
              <form
                className="flex items-center gap-1 sm:gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  const date = new FormData(event.currentTarget).get("date");
                  if (typeof date === "string" && date !== daily.date) {
                    navigateRewind({ day: date });
                  }
                }}
              >
                <input
                  key={daily.date}
                  aria-label="Rewind date"
                  type="date"
                  name="date"
                  min={earliestDay}
                  max={daily.latest_date}
                  defaultValue={daily.date}
                  required
                  className="card min-w-0 px-2 py-1 text-sm sm:text-base [&::-webkit-calendar-picker-indicator]:drop-shadow-[0_0_1px_var(--color-fg)]"
                />
                <button type="submit" className={dateArrowClass}>
                  Go
                </button>
              </form>
              <button
                aria-label="Next day"
                className={dateArrowClass}
                onClick={() => navigateRewind({ day: addDays(daily.date, 1) })}
                disabled={daily.date === daily.latest_date}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          {weekly && (
            <div className="flex items-center gap-3">
              <button
                aria-label="Previous week"
                className={dateArrowClass}
                onClick={() =>
                  navigateRewind({ week_start: addDays(weekly.start, -7) })
                }
                disabled={
                  firstActivity && firstActivity.getTime() >= Date.parse(weekly.starts_at)
                }
              >
                <ChevronLeft size={20} />
              </button>
              <p className="text-center font-medium" aria-live="polite">
                {weekRange}
              </p>
              <button
                aria-label="Next week"
                className={dateArrowClass}
                onClick={() =>
                  navigateRewind({ week_start: addDays(weekly.start, 7) })
                }
                disabled={weekly.start === weekly.latest_start}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          {stats && <Rewind stats={stats} includeTime={showTime} />}
        </div>
      </div>
    </div>
  );
}
