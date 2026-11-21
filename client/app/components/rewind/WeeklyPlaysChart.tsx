import type { WeeklyRewind } from "api/api";
import {
  Bar,
  BarChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const weekday = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  timeZone: "UTC",
});
const number = new Intl.NumberFormat();
const signedNumber = new Intl.NumberFormat(undefined, {
  signDisplay: "exceptZero",
});
const signedPercent = new Intl.NumberFormat(undefined, {
  style: "percent",
  signDisplay: "exceptZero",
  maximumFractionDigits: 1,
});

export default function WeeklyPlaysChart({ days }: Pick<WeeklyRewind, "days">) {
  const data = days.map((day) => ({
    ...day,
    weekday: weekday.format(new Date(`${day.date}T00:00:00Z`)),
  }));
  const plays = days.reduce((total, day) => total + day.plays, 0);
  const previousPlays = days.reduce((total, day) => total + day.previous_plays, 0);
  const change = plays - previousPlays;
  const percentageColor = change > 0 ? "success" : change < 0 ? "error" : "";

  return (
    <section aria-label="Daily plays" className="min-w-0">
      <h2 className="mb-4 text-2xl!">Daily plays</h2>
      <dl className="mb-4 grid grid-cols-3 gap-2 text-sm sm:gap-4">
        <div>
          <dt className="color-fg-secondary">Selected week</dt>
          <dd className="text-xl font-semibold">{number.format(plays)}</dd>
        </div>
        <div>
          <dt className="color-fg-secondary">Previous week</dt>
          <dd className="text-xl font-semibold">{number.format(previousPlays)}</dd>
        </div>
        <div>
          <dt className="color-fg-secondary">Change</dt>
          {previousPlays > 0 && (
            <dd className={`text-xl font-semibold ${percentageColor}`}>
              {signedPercent.format(change / previousPlays)}
            </dd>
          )}
          <dd className={previousPlays > 0 ? "color-fg-secondary" : "text-xl font-semibold"}>
            {signedNumber.format(change)}
          </dd>
        </div>
      </dl>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart
          data={data}
          accessibilityLayer
          title="Plays by weekday"
          desc="Use the arrow keys to compare plays for each day."
          margin={{ right: 4 }}
        >
          <XAxis
            dataKey="weekday"
            interval={0}
            tick={{ fill: "var(--color-fg-secondary)", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            domain={[0, (max: number) => Math.max(1, max)]}
            width={32}
            tick={{ fill: "var(--color-fg-secondary)", fontSize: 12 }}
          />
          <Tooltip
            itemSorter="dataKey"
            cursor={{ fill: "var(--color-bg-tertiary)", fillOpacity: 0.5 }}
            contentStyle={{
              backgroundColor: "var(--color-bg)",
              borderColor: "var(--color-bg-tertiary)",
              borderRadius: "var(--border-radius)",
            }}
            itemStyle={{ color: "var(--color-fg)" }}
            labelStyle={{ color: "var(--color-fg)" }}
          />
          <Legend
            itemSorter="dataKey"
            wrapperStyle={{ fontSize: 12 }}
            formatter={(label) => <span className="color-fg-secondary">{label}</span>}
          />
          <Bar
            dataKey="plays"
            name="Selected week"
            fill="var(--color-primary)"
            isAnimationActive={false}
          />
          <Bar
            dataKey="previous_plays"
            name="Previous week"
            fill="var(--color-fg-tertiary)"
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
