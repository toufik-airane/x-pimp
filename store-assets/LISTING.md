# Chrome Web Store listing

## Product details

**Name:** x-pimp

**Category:** Productivity

**Language:** English

**Summary:** A calmer, centered X.com feed with noise removal, focus tools,
optional hourly bell, and local weather.

**Detailed description:**

x-pimp makes the desktop X.com feed calmer and easier to focus on.

It removes the right rail, promoted posts, Grok controls, the Chat drawer, and
most left navigation. Your feed stays centered at the width you choose, while
your account avatar remains available.

A floating refresh control prevents accidental feed churn with a six-second
cooldown and shake feedback. The quiet left-side workspace includes a local
clock, a persistent 15/30/45-minute Pomodoro timer, and optional local weather.
An optional sound control schedules a locally bundled singing-bowl bell at the
top of each hour. It is disabled by default.

Privacy first:

- no analytics, advertising, accounts, or developer server;
- X.com content is processed only in your browser and is not retained or sent;
- weather is off until you opt in;
- coordinates are rounded before the weather request and are never stored by
  x-pimp.

x-pimp is an independent extension and is not affiliated with X Corp. or
Open-Meteo.

## Privacy practices

**Single purpose:** Customize the desktop X.com interface to reduce distraction
and support focused feed use.

**storage justification:** Stores the selected feed width and cleanup setting,
plus Pomodoro state, hourly-bell preference, and the latest weather result, so
the user's chosen layout and optional focus tools survive page reloads.

**alarms justification:** Schedules the user-enabled singing-bowl sound at the
top of every hour. Disabling the sound control removes the alarm immediately.

**offscreen justification:** Creates an audio-only offscreen document when a
scheduled bell or user-requested preview must play. It loads only the bundled
MP3 and does not display content or access remote resources.

**geolocation justification:** Gets the user's location only after an explicit
button click, rounds it to two decimal places, and uses it for the requested
local weather. Coordinates are not stored.

**Host access for x.com:** Required to apply the user-visible interface cleanup,
feed sizing, refresh cooldown, Pomodoro, clock, and weather card on X.com.

**Host access for api.open-meteo.com:** Required only to fetch current weather
after the user opts in.

**Remote code:** No. All executable code and audio are included in the extension
package. The Open-Meteo response contains weather data only and is not executed.

**Data categories to disclose:** Location; Website content.

**Website-content explanation:** X.com page structure, interface labels, and the
first five words of loaded posts are processed locally to hide selected controls
and provide the tweet-outline navigation labels. No posts, messages, account
details, or other page content are stored or sent.

**Location explanation:** Location is handled only for the opt-in weather
feature. Rounded coordinates are sent over HTTPS to Open-Meteo and are not
stored by x-pimp. Turning weather off deletes its cache and stops updates.

Certify every Limited Use statement. Use
`https://toufik-airane.github.io/x-pimp/` for the privacy-policy field.

## Distribution

**Visibility:** Public

**Regions:** All regions

**Mature content:** No

**In-app purchases:** No

## Required graphic assets

- Store icon: `assets/icons/icon128.png` (128×128 PNG)
- Screenshot: `store-assets/screenshot-1.png` (1280×800 PNG)
- Small promo tile: `store-assets/small-promo.png` (440×280 PNG)
- Marquee promo tile: `store-assets/marquee-promo.png` (1400×560 PNG)

The icon artwork is original. Do not upload `assets/icon-source.png` as the
store icon; it is the high-resolution working source.
