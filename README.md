<div align="center">
  
![Koito logo](https://github.com/user-attachments/assets/bd69a050-b40f-4da7-8ff1-4607554bfd6d)

_Koito (小糸) is a Japanese surname. It is also homophonous with the words 恋と (koi to), meaning "and/with love"._

</div>

<div align="center">
  
  [![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/gabehf)
  
</div>

Koito is a modern, themeable ListenBrainz-compatible scrobbler for self-hosters who want control over their data and insights into their listening habits.
It supports relaying to other compatible scrobblers, so you can try it safely without replacing your current setup.

> This project is under active development and still considered "unstable", which means the main branch can be unusable at times, and some breaking changes may occur. If you don't want to replace your current scrobbler
> with Koito quite yet, you can [set up a relay](https://koito.io/guides/scrobbler/#set-up-a-relay) from Koito to another ListenBrainz-compatible
> scrobbler. This is what I've been doing for the entire development of this app and it hasn't failed me once. Or, you can always use something
> like [multi-scrobbler](https://github.com/FoxxMD/multi-scrobbler).

## What this fork adds

### Daily Rewind

On the Rewind page, select **Daily** to see your latest completed day. Use the arrows to browse past days or pick a date to jump to it.

- 📊 **Daily stats.** See total plays, known listening time, and unique tracks, and compare your play count with the previous day.
- 🕒 **Listening Clock.** Select an hour to see the tracks you played and when you played them.
- 🎧 **Top and first-time listens.** See your most-played artists, albums, and tracks, plus how many tracks and artists you heard for the first time in your Koito history.

### Weekly Rewind

On the Rewind page, select **Weekly** to see your latest completed week.

- 📅 **Browse past weeks.** Each week runs Friday through Thursday.
- 🎧 **Top listens.** See your most-played artists, albums, and tracks.
- 📊 **Daily plays.** Compare each weekday and the weekly total with the previous week.
- 🕒 **Listening Clock.** Explore plays by hour of day and see when you listened most.
- 📝 **Quick Facts.** See your known listening time, average plays per day, and busiest day.

### Bug fixes

- Fixed duplicate track creation when a listen submitted by artist and title matches an existing track’s secondary alias. See [upstream issue #369](https://github.com/gabehf/Koito/issues/369).

## Features

- ⚡ More performant than similar software
- 🖌️ Sleek UI
- 🔁 Compatible with anything that scrobbles to ListenBrainz
- 🔌 Easy relay to your existing setup
- 📂 Import support for Maloja, ListenBrainz, LastFM, and Spotify

## Demo

You can view my public instance with my listening data at https://koito.mnrva.dev

## Screenshots

![screenshot one](assets/screenshot1_2.png)
![screenshot two](assets/screenshot2.png)
![screenshot three](assets/screenshot3.png)

## Installation

See the [installation guide](https://koito.io/guides/installation/), or, if you just want to cut to the chase, use this docker compose file with a minimal configuration:

```yaml
services:
  koito:
    image: gabehf/koito:latest
    container_name: koito
    ports:
      - "4110:4110"
    volumes:
      - ./koito:/etc/koito
    restart: unless-stopped
```

## Importing Data

See the [data importing guide](https://koito.io/guides/importing/) in the docs.

Before importing, it is recommended you set up any image sources you want to have enabled. You can view the configuration options for image sources in the full list of configuration options.

## Full list of configuration options

See the [configuration reference](https://koito.io/reference/configuration/) in the docs.

## Contributing

There are currently some known issues that I am actively working on, in addition to adding new features. If you want to contribute (especially more and more robust testing) feel free to fork the repository and make a pull request with your changes.

If you have any feature ideas, open a GitHub issue to let me know. I'm sorting through ideas to decide which data visualizations and customization options to add next.

You can also donate money to me, @gabehf, the primary developer, via the "sponsor" or "ko-fi" buttons, and I will spend that money on luxurious trips and fine cuisine in foreign countries, or rent.

## Albums that fueled development + notes

More relevant here than any of my other projects...

Not just during development, you can see my complete listening data on my [live demo instance](https://koito.mnrva.dev).

#### Random notes

- I find it a little annoying when READMEs use emoji but everyone else is doing it so I felt like I had to...
- About 50% of the reason I built this was minor/not-so-minor greivances with Maloja. Could I have just contributed to Maloja? Maybe, but I like building stuff and I like Koito's UI a lot more anyways.
