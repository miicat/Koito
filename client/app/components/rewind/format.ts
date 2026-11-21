const number = new Intl.NumberFormat();

export function formatHour(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export function formatCount(count: number, singular: string) {
  return `${number.format(count)} ${singular}${count === 1 ? "" : "s"}`;
}

export function formatPlays(plays: number) {
  return formatCount(plays, "play");
}

export function formatListeningTime(minutes: number) {
  return minutes < 60
    ? `${minutes} min`
    : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
