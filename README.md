# x-zen

![x-zen logo](assets/icons/icon128.png)

A small Chrome extension that removes the complete right rail from desktop
X.com. This includes modules such as **Live on X**, **Today’s News**, and
**What’s happening**. The main timeline becomes wider when space permits.

**[Install x-zen from the Chrome Web Store](https://chromewebstore.google.com/detail/x-zen/nonemmfagigefdfmgebidhnebidanedg)**

Current source version: **1.0.8**. See [CHANGELOG.md](CHANGELOG.md) for release
notes and [SECURITY.md](SECURITY.md) for vulnerability reporting.

The left Home control is replaced by a lean, translucent X-style refresh control
beside the lower-right edge of the feed with a six-second cooldown. The first
click works normally. More clicks during the cooldown are blocked and shake the
refresh icon.

The feed width is adjustable from 560 to 900 pixels in 20-pixel steps and stays
centered on the desktop viewport. The default is 720 pixels. When the window is
narrower, the feed contracts enough to preserve the left-side gadgets without
overlap. Promoted posts, the Grok navigation entry, the Grok drawer, Grok action
buttons, and the floating Chat drawer button are removed.

The left navigation is reduced to an 88-pixel strip. The account avatar remains
at the bottom but moves to the bottom-right of the left column, centered beneath
Home and separated from the feed by a lean gap. Home keeps its horizontal
position above the clock with generous space from the viewport's top edge and
shows X blue on the Home route. X's logo, navigation links, and Post control are
hidden.
Home and Refresh keep accessible 46-pixel click targets while their quiet
40-pixel translucent discs match the avatar's visual scale.

A sound control beside Home enables an optional hourly singing-bowl bell. It is
off by default. Enabling it plays one preview, then Chrome rings the locally
bundled sound at the top of every hour, even when no X tab is open. Disabling
the control removes the scheduled alarm immediately.

An X-style Pomodoro card uses the upper-left space with 15, 30, and 45-minute
presets, Start/Pause, and Reset controls. Its state is stored locally so an X
reload does not discard an active focus session. A local clock appears above
the timer in the same card.

Keyboard controls use `Alt` on Windows/Linux or `Option` on macOS: `R` softly
refreshes the feed, `P` starts or pauses the Pomodoro timer, and `1`, `2`, or
`3` selects 15, 30, or 45 minutes. Shortcuts stay inactive while typing in an
input, search field, post composer, or message.

An opt-in weather card appears below the timer. Chrome requests location
access, coordinates are rounded before an Open-Meteo request, and no coordinates
are stored. Only the latest conditions are cached locally and treated as stale
after 30 minutes. Weather can be turned off from the card. Both left-side cards
stay slightly transparent until hovered or focused. Weather follows Pomodoro's
measured height with a consistent gap, so the cards cannot overlap at narrower
feed layouts.

A slim tweet outline stays fixed beside the feed at the left edge of the right
panel. Its top aligns with Home, while its left-justified anchors extend outward
from the feed. Anchors refresh without moving the rail. Each small anchor uses
the first five words of its loaded post. X article posts use their visible
article title instead of a generic media-post label. The blue anchor tracks the
post at the top reading line below X's sticky header. Selecting an anchor
scrolls smoothly to that post.
Labels exist only in the live page DOM; they are not stored or transmitted.
The outline accumulates posts that remain part of the current timeline. It keeps
anchors through brief X DOM replacements, then removes entries that do not
reconnect so stale labels cannot remain. Disconnected anchors leave the layout
immediately, so they cannot create temporary empty rows before cleanup. The list
grows to half the screen height and then becomes an independently scrollable
compact list. It never auto-scrolls when the active post changes, so refreshed
labels do not make the table run across the screen. A small pinned row refreshes
to show the current post only when its original anchor is outside the visible
list, avoiding duplicate labels while the ordered anchor list remains stationary.

The extension uses an original calathea-inspired leaf icon. It is not affiliated
with X Corp. or Open-Meteo.

The empty canvas around the feed uses an original, locally bundled background
of softly blurred green foliage beneath a dark translucent veil and restrained
emerald ambient light. The feed stays opaque for readability, while the
left-side cards use restrained backdrop blur.

When X opens a photo, video, profile photo, or header photo, x-zen yields the
complete screen to the media viewer. The plant canvas becomes solid black, and
the focus cards, outline, floating controls, and moved account control stay
hidden until the viewer closes.

## Install

Install x-zen from the
[Chrome Web Store](https://chromewebstore.google.com/detail/x-zen/nonemmfagigefdfmgebidhnebidanedg).

To load the source checkout directly:

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select this `x-zen` directory.
5. Reload an open X.com tab.

Use the extension button to restore or remove the right rail at any time.

## Privacy

x-zen runs only on `x.com`. It stores display preferences with
`chrome.storage.sync` and timer/weather state with `chrome.storage.local`. It
processes only the short excerpts and visible article titles needed for outline
labels and does not store or transmit account content. Weather remains opt-in;
when enabled, rounded coordinates are sent only to Open-Meteo and are not
stored.
See [PRIVACY.md](PRIVACY.md) for the complete privacy policy.

Public policy URL: <https://toufik-airane.github.io/x-zen/>

## Publish

Store copy, privacy-field answers, and asset notes are in
[`store-assets/LISTING.md`](store-assets/LISTING.md). Build the upload ZIP with:

```sh
node scripts/package.mjs
```

Pushing a signed tag whose name matches the manifest version, such as
`v1.0.8`, runs the release workflow. GitHub verifies the source, runs Semgrep,
builds the ZIP, writes its SHA-256 file, and publishes both assets in a GitHub
Release. A mismatched tag and manifest version fails before packaging.

## Check the source

```sh
node scripts/verify.mjs
```

Run the security scan with an isolated Semgrep installation:

```sh
uvx semgrep scan --config p/javascript --config p/security-audit \
  --config p/secrets --metrics=off .
```

X can change its page markup without notice. If the rail returns after an X
update, the `sidebarColumn` selector in `styles.css` might need an update.

## License

[MIT](LICENSE)
