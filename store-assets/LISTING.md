# Chrome Web Store listing

## Product details

**Name:** x-zen

**Category:** Productivity

**Language:** English

**Summary:** A calmer, centered X.com feed with noise removal, focus tools,
optional hourly bell, and local weather.

**Detailed description:** Copy the complete plain-text contents of
`store-assets/DESCRIPTION.txt`. Chrome Web Store does not render Markdown in
this field.

**Homepage URL:** `https://toufik-airane.github.io/x-zen/`

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

**Website-content explanation:** X.com page structure, interface labels, short
post excerpts, and visible article titles are processed locally to hide selected
controls and provide outline navigation labels. No posts, messages, account
details, article titles, or other page content are stored or sent.

**Location explanation:** Location is handled only for the opt-in weather
feature. Rounded coordinates are sent over HTTPS to Open-Meteo and are not
stored by x-zen. Turning weather off deletes its cache and stops updates.

Certify every Limited Use statement. Use
`https://toufik-airane.github.io/x-zen/` for the privacy-policy field.

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

The icon artwork is original. Its editable vector source is
`assets/logo-source.svg`; `assets/icon-source.png` is the high-resolution
raster export. Upload only `assets/icons/icon128.png` as the store icon.

The promo tiles have editable SVG sources beside their PNG exports. To refresh
the screenshot from the current product, start the dedicated Chrome test
profile with localhost remote debugging, open X.com, and run:

```sh
node scripts/capture-store-screenshot.mjs
```

The capture script reloads the page, uses the required 1280×800 viewport, and
replaces account and post content with anonymous placeholders before capture.
