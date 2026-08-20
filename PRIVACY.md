# x-pimp Privacy Policy

Effective date: August 20, 2026

x-pimp has one purpose: make the desktop X.com feed calmer and easier to focus
on. It removes selected interface elements and promoted posts, centers the
feed, limits rapid refreshes, and adds optional focus tools.

## Data x-pimp handles

- **X.com page content:** x-pimp processes X.com page structure, interface
  labels, and the first five words of loaded posts locally in the browser. The
  words are used only as navigation labels in the tweet outline. x-pimp does
  not store or transmit posts, messages, account details, or other X.com
  content.
- **Location:** only after the user selects **Share approximate location**, the
  browser gives x-pimp the device location. x-pimp rounds latitude and
  longitude to two decimal places before sending them over HTTPS to Open-Meteo
  to request local weather. x-pimp does not store the exact or rounded
  coordinates.
- **Extension settings:** feed width and interface preferences are stored with
  Chrome synchronized storage. Google can synchronize these values when Chrome
  Sync is enabled.
- **Focus and weather state:** the Pomodoro state and latest weather result are
  stored locally in Chrome. Cached weather is treated as stale after 30 minutes
  and is then updated while weather remains enabled. The cache contains
  conditions and temperatures, not coordinates.

## Data sharing

Rounded coordinates are sent only to Open-Meteo when the user enables or
updates weather. Open-Meteo can process the request IP address and coordinates
under its [Terms and Privacy policy](https://open-meteo.com/en/terms), which
states that API server logs can be retained for up to 90 days. No other user
data is sold, shared, or transferred. x-pimp has no advertising, analytics,
user accounts, or developer-operated server.

## Retention and deletion

x-pimp keeps settings and feature state only in Chrome storage. Turning weather
off in its card deletes the cached result and stops automatic updates. Users
can delete all extension data by removing the extension or by clearing its
stored data in Chrome. Open-Meteo controls its own server-log retention.

## Security

Weather requests use HTTPS. x-pimp does not execute remote code. All extension
logic is included in the installed package.

## Limited Use

The use of information received from Google APIs will adhere to the Chrome Web
Store User Data Policy, including the Limited Use requirements. Data is used
only to provide x-pimp's disclosed user-facing features. It is not used for
advertising, credit decisions, sale, or unrelated purposes, and humans are not
permitted to read user data.

## Changes and contact

Material changes to these practices will be disclosed in the extension before
the changed handling begins. Questions can be sent through the support contact
on the x-pimp Chrome Web Store listing.

x-pimp is an independent extension and is not affiliated with X Corp. or
Open-Meteo.
