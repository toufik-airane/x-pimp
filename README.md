# x-zen

![x-zen calathea leaf logo](assets/icons/icon128.png)

A calmer, centered desktop X.com feed with noise removal and small focus tools.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/x-zen/nonemmfagigefdfmgebidhnebidanedg)
· [Website](https://toufik-airane.github.io/x-zen/)
· [Privacy policy](PRIVACY.md)

Current version: **1.0.8** · Requires Chrome 116 or later

## Highlights

- Removes the right rail, promoted posts, Grok controls, the Chat drawer, and
  most left navigation.
- Centers the feed at an adjustable width from 560 to 900 pixels.
- Adds compact Home and Refresh controls that reveal pending posts and use a
  six-second refresh cooldown.
- Adds a local clock and a persistent 15, 30, or 45-minute Pomodoro timer.
- Adds an optional hourly singing-bowl bell from a bundled local audio file.
- Adds optional local weather after explicit location consent.
- Adds a post outline for navigation. Standard posts use a short excerpt;
  article posts use their visible article title.
- Hides extension controls while X displays a photo or video viewer.

The interface uses an original calathea-inspired leaf icon and a locally
bundled plant background. x-zen is independent and is not affiliated with X
Corp. or Open-Meteo.

## Controls

| Action | Mouse or keyboard |
| --- | --- |
| Open Home | Select **Home** |
| Refresh the Home feed | Select **Refresh**, or press `Alt/Option + R` |
| Start or pause the timer | Select **Start/Pause**, or press `Alt/Option + P` |
| Select 15, 30, or 45 minutes | Select a preset, or press `Alt/Option + 1`, `2`, or `3` |
| Change the feed width | Open the extension popup and use the width controls |
| Enable the hourly bell | Select the sound control beside Home |
| Enable local weather | Select **Share approximate location** in the weather card |

Keyboard shortcuts stay inactive while you type in an input, search field,
post composer, or message.

## Install

Install x-zen from the
[Chrome Web Store](https://chromewebstore.google.com/detail/x-zen/nonemmfagigefdfmgebidhnebidanedg).

To load the source checkout directly:

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the `x-zen` directory.
5. Reload an open X.com tab.

## Privacy

x-zen has no analytics, advertising, accounts, or developer-operated server.
It processes X.com page structure, interface labels, short post excerpts, and
visible article titles locally. It does not store or transmit X.com content.

Weather is off until the user opts in. When enabled, x-zen rounds the device
coordinates to two decimal places and sends them over HTTPS only to Open-Meteo.
Coordinates are not stored. Turning weather off deletes the cached weather
result and stops updates.

| Permission | Why it is required |
| --- | --- |
| `storage` | Preserve feed settings, refresh cooldown, Pomodoro state, bell preference, and cached weather. |
| `geolocation` | Request location only after explicit consent for local weather. |
| `alarms` | Schedule the optional hourly bell. |
| `offscreen` | Play the bundled bell because a Manifest V3 service worker cannot play audio. |
| `x.com` access | Apply the interface cleanup and focus tools to X.com. |
| `api.open-meteo.com` access | Fetch weather only after the user enables it. |

Read the complete [privacy policy](PRIVACY.md). The public policy page is
<https://toufik-airane.github.io/x-zen/>.

## Development

The project uses browser-native JavaScript and has no runtime package
dependencies. Run the complete syntax, source, asset, and behavior checks with
Node.js 22:

```sh
node scripts/verify.mjs
```

Run the security scan used by the release workflow:

```sh
uvx semgrep scan --config p/javascript --config p/security-audit \
  --config p/secrets --metrics=off .
```

Build the Chrome Web Store upload archive:

```sh
node scripts/package.mjs
```

Store copy, privacy answers, and graphic-asset details are in
[`store-assets/LISTING.md`](store-assets/LISTING.md).

## Release process

The manifest version and signed tag must match. Pushing a signed tag such as
`v1.0.8` runs source checks and Semgrep, builds and validates the ZIP, writes a
SHA-256 checksum, and publishes both files in a GitHub Release.

X can change its page structure without notice. If a removed control returns,
check the selectors in `styles.css` and the related content module.

See [CHANGELOG.md](CHANGELOG.md) for release notes and [SECURITY.md](SECURITY.md)
for private vulnerability reporting.

## License

[MIT](LICENSE)
