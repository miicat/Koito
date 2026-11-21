import { type RewindStats } from "api/api";
import RewindStatText from "./RewindStatText";
import { RewindTopItem } from "./RewindTopItem";
import DailyListeningDetails, { FirstTimeListens } from "./DailyListeningDetails";
import WeeklyListeningDetails from "./WeeklyListeningDetails";
import WeeklyPlaysChart from "./WeeklyPlaysChart";

interface Props {
  stats: RewindStats;
  includeTime?: boolean;
}

export default function Rewind(props: Props) {
  const {
    daily,
    weekly,
    top_artists: artists,
    top_albums: albums,
    top_tracks: tracks,
  } = props.stats;
  if (!daily && !weekly && (!artists[0] || !albums[0] || !tracks[0])) {
    return <p>Not enough data exists to create a Rewind for this period :(</p>;
  }
  return (
    <div
      className={`flex flex-col gap-7 card pt-4 sm:pt-6 pb-8 sm:pb-12 px-4 sm:px-8 ${
        daily || weekly ? "w-full min-w-0" : "min-w-[350px]"
      }`}
    >
      <div className="w-full text-start shrink-0 sm:ml-6">
        <span
          className="
            relative inline-block
            text-2xl md:text-4xl font-semibold
          "
        >
          <span
            className="
              absolute inset-0
              sm:-translate-x-6 translate-y-9 sm:translate-y-11
              bg-(--color-primary)
              z-0
              h-0.5
            "
            aria-hidden
          />
          <h5 className="mb-2">{props.stats.title}</h5>
        </span>
      </div>
      {daily && <DailyListeningDetails daily={daily} stats={props.stats} />}
      {weekly && (
        <>
          <WeeklyPlaysChart days={weekly.days} />
          <WeeklyListeningDetails
            weekly={weekly}
            minutesListened={props.stats.minutes_listened}
            avgPlaysPerDay={props.stats.avg_plays_per_day}
          />
        </>
      )}
      {weekly && !artists.length && !albums.length && !tracks.length && (
        <p className="color-fg-secondary">
          No top artists, albums, or tracks this week.
        </p>
      )}
      {(!daily || props.stats.plays > 0) && (
        <div className={daily ? "grid gap-3 sm:grid-cols-3" : "flex flex-col gap-7"}>
          <RewindTopItem
            title="Top Artist"
            imageSrc={artists[0]?.item.image?.medium}
            items={artists}
            getLabel={(a) => a.name}
            includeTime={props.includeTime}
            compact={!!daily}
          />
          <RewindTopItem
            title="Top Album"
            imageSrc={albums[0]?.item.image?.medium}
            items={albums}
            getLabel={(a) => a.title}
            includeTime={props.includeTime}
            compact={!!daily}
          />
          <RewindTopItem
            title="Top Track"
            imageSrc={tracks[0]?.item.image?.medium}
            items={tracks}
            getLabel={(t) => t.title}
            includeTime={props.includeTime}
            compact={!!daily}
          />
        </div>
      )}
      {daily ? (
        props.stats.plays > 0 && (
          <FirstTimeListens
            tracks={props.stats.new_tracks}
            artists={props.stats.new_artists}
          />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-5">
          {!weekly && (
            <RewindStatText
              figure={`${props.stats.minutes_listened}`}
              text="Minutes"
            />
          )}
          <RewindStatText figure={`${props.stats.unique_tracks}`} text="Tracks" />
          <RewindStatText
            figure={`${props.stats.new_tracks}`}
            text="New tracks"
          />
          <RewindStatText figure={`${props.stats.plays}`} text="Plays" />
          <RewindStatText figure={`${props.stats.unique_albums}`} text="Albums" />
          <RewindStatText
            figure={`${props.stats.new_albums}`}
            text="New albums"
          />
          {!weekly && (
            <RewindStatText
              figure={`${props.stats.avg_plays_per_day.toFixed(1)}`}
              text="Plays / day"
            />
          )}
          <RewindStatText
            figure={`${props.stats.unique_artists}`}
            text="Artists"
          />
          <RewindStatText
            figure={`${props.stats.new_artists}`}
            text="New artists"
          />
        </div>
      )}
    </div>
  );
}
