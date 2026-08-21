# Changelog

All notable changes to x-zen are documented here. Versions follow
[Semantic Versioning](https://semver.org/).

## 1.0.8 — 2026-08-21

- Completed the x-zen brand rollout across the extension interface, internal
  namespaces, documentation, website, release artifacts, and store assets.
- Rebuilt the promotional tiles with the x-zen name and aligned public links
  with the renamed repository and GitHub Pages site.
- Recreated extension-owned alarms under the x-zen namespace during upgrades so
  obsolete scheduled entries cannot remain active.

## 1.0.7 — 2026-08-21

- Replaced the refresh-and-sparkle logo with a calathea-inspired leaf mark and
  carried it through every extension icon and promotional tile.
- Use the visible X article title in the outline instead of a generic media-post
  label.
- Block preview and scheduled gong playback at both the background and audio
  layers whenever hourly sound is disabled.

## 1.0.6 — 2026-08-21

- Refreshed the logo, extension icons, popup, screenshot, and promotional
  artwork with a cohesive mint-and-coral visual system and editable SVG sources.
- Kept Home, sound, Pomodoro, weather, Refresh, and the tweet outline aligned
  beside the feed across laptop and external-display widths.
- Reduced the bottom account control to its avatar so X's verified badge,
  account text, and overflow menu cannot overlap the feed.
- Reveal the extension interface as one stable group after the feed is ready,
  avoiding staggered or sliding components during reload.
- Added reproducible privacy-masked store capture tooling and automated graphic
  dimension checks.

## 1.0.5 — 2026-08-21

- Hide the plant background, focus gadgets, outline, floating controls, and
  moved account control while X displays a photo or video viewer.
- Restore the normal x-zen canvas and controls when the media viewer closes.

## 1.0.4 — 2026-08-20

- Replaced the enabled sound control's bright green with a muted dark blue so
  it keeps the same quiet visual hierarchy as Home.

## 1.0.3 — 2026-08-20

- Fixed annotated-tag verification in the release workflow by fetching tag
  history, and upgraded the pinned GitHub actions to their Node.js 24 releases.

## 1.0.2 — 2026-08-20

- Added a pinned GitHub Actions workflow that verifies, security-scans, builds,
  checksums, and publishes releases from matching signed version tags.

## 1.0.1 — 2026-08-20

- Included `README.md` in the downloadable extension ZIP so installation and
  usage instructions remain available after extraction.

## 1.0.0 — 2026-08-20

- Centered, adjustable X feed with the right rail and distracting controls
  removed.
- Six-second Home and feed-refresh cooldown with shake feedback.
- Fixed tweet-outline navigation with compact post labels.
- Local clock, 15/30/45-minute Pomodoro timer, and opt-in local weather.
- Peaceful blurred plant canvas with translucent side components.
- Disabled-by-default hourly singing-bowl control with local alarm playback.
- Privacy documentation, reproducible checks, and a clean Semgrep security
  scan across the tracked source.
