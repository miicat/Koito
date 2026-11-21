import { useState, type ReactNode } from "react";
import { Sector } from "recharts";
import { formatHour, formatPlays } from "./format";

const hourAngle = 360 / 24;
const innerRadius = 43;
const outerRadius = 114;
const dialMarks = [
  { hour: 0, x: 0, y: -143 },
  { hour: 6, x: 141, y: 0 },
  { hour: 12, x: 0, y: 143 },
  { hour: 18, x: -141, y: 0 },
];

type Props = {
  hours: number[];
  renderHour?: (hour: number) => ReactNode;
};

export default function ListeningClock({ hours, renderHour }: Props) {
  const busiestHour = hours.reduce(
    (peak, plays, hour) => (plays > hours[peak] ? hour : peak),
    0,
  );
  const busiestPlays = hours[busiestHour];
  const [selectedHour, setSelectedHour] = useState<number>();
  const hour = selectedHour ?? busiestHour;
  const time = formatHour(hour);
  const plays = formatPlays(hours[hour]);
  const radians = (hour * hourAngle * Math.PI) / 180;

  return (
    <section aria-label="Listening Clock" className="min-w-0">
      <h2 className="mb-2 text-2xl!">Listening Clock</h2>
      {busiestPlays > 0 ? (
        <p className="mb-4 text-sm color-fg-secondary">
          Busiest hour{" "}
          <strong className="color-fg">
            {formatHour(busiestHour)}
            {renderHour && `–${formatHour(busiestHour + 1)}`}
          </strong>
          {` · ${formatPlays(busiestPlays)}`}
        </p>
      ) : (
        <p className="mb-4 text-sm color-fg-secondary">No plays this week.</p>
      )}
      {renderHour && (
        <p className="mb-3 text-sm color-fg-secondary">Select an hour to see its tracks.</p>
      )}
      <div className="relative mx-auto w-full max-w-[340px] rounded-(--border-radius) focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-(--color-primary)">
        <input
          type="range"
          className="sr-only"
          aria-label="Listening hour"
          aria-valuetext={`${time}, ${plays}`}
          min={0}
          max={23}
          value={hour}
          onChange={(event) =>
            setSelectedHour(event.currentTarget.valueAsNumber)
          }
        />
        <svg viewBox="-166 -158 332 316" className="block w-full" aria-hidden="true">
          {[innerRadius, (innerRadius + outerRadius) / 2, outerRadius].map((radius) => (
            <circle
              key={radius}
              r={radius}
              fill="none"
              stroke="var(--color-fg-tertiary)"
              strokeOpacity={0.32}
            />
          ))}
          {hours.map((count, clockHour) => {
            const angle = 90 - clockHour * hourAngle;
            const startAngle = angle + hourAngle / 2;
            const endAngle = angle - hourAngle / 2;
            return (
              <g key={clockHour} className="group/hour">
                <Sector
                  className="pointer-events-none opacity-0 group-hover/hour:opacity-100"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  fill="var(--color-primary)"
                  fillOpacity={0.25}
                />
                {count > 0 && (
                  <Sector
                    className="group-hover/hour:fill-(--color-primary)"
                    innerRadius={innerRadius}
                    outerRadius={
                      innerRadius + ((outerRadius - innerRadius) * count) / busiestPlays
                    }
                    startAngle={angle + 5.5}
                    endAngle={angle - 5.5}
                    fill={
                      clockHour === busiestHour
                        ? "var(--color-primary)"
                        : "var(--color-fg-tertiary)"
                    }
                    cornerRadius={2}
                  />
                )}
                <Sector
                  data-hour={clockHour}
                  className="cursor-pointer"
                  innerRadius={innerRadius}
                  outerRadius={outerRadius + 10}
                  startAngle={startAngle}
                  endAngle={endAngle}
                  fill="transparent"
                  onMouseEnter={
                    renderHour ? undefined : () => setSelectedHour(clockHour)
                  }
                  onClick={() => setSelectedHour(clockHour)}
                />
              </g>
            );
          })}
          <circle
            cx={(outerRadius + 8) * Math.sin(radians)}
            cy={-(outerRadius + 8) * Math.cos(radians)}
            r={2.5}
            fill="var(--color-primary)"
            pointerEvents="none"
          />
          {dialMarks.map(({ hour, x, y }) => (
            <text
              key={hour}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-(--color-fg-secondary) text-xs"
            >
              {formatHour(hour)}
            </text>
          ))}
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className="font-semibold tabular-nums">{time}</span>
          <span className="text-xs color-fg-secondary">{plays}</span>
        </div>
      </div>
      {renderHour?.(hour)}
    </section>
  );
}
