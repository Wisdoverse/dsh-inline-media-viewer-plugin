# dsh-inline-media-viewer

English | [简体中文](README.zh-CN.md)

Persistent inline image, video, and audio previews for DeepSeek Harness Web
conversations. Any media path or media URL mentioned in a chat turn renders
inline under that turn — no more copying paths out of a log.

```
https://…/view?filename=frame.png        →  <img>
exports/demo.mp4                       →  <video controls>
audio/sound.mp3                          →  <audio controls>
```

## Features

- **Inline previews** in the conversation tail: images, videos, and audio
  (png/jpg/jpeg/webp/gif/avif/bmp/svg, mp4/webm/mov/m4v/mkv/avi/ogv,
  mp3/wav/m4a/aac/ogg/oga/flac/opus).
- **Workspace-confined local reads** — a path renders only when it resolves
  inside the calling session's workspace root (`realpath` + containment; no
  symlink escapes).
- **ComfyUI proxy with configurable server address** — ComfyUI media URLs on
  the local aliases (`127.0.0.1:8188` / `localhost:8188`) or on the server
  address set in the settings page are fetched server-side from the
  configured origin, so remote users and HTTPS pages still see the media.
- **Size-capped** transfers (48 MiB) and 20 s remote timeout.
- **User settings page** — auto-render toggle, per-turn cap (1–30), max media
  height (160–1200 px).

## Install

Add the bundle to a web profile and restart the stack:

```jsonc
// profiles/web/package.json
{
  "dependencies": {
    "dsh-inline-media-viewer": "link:/path/to/local-plugins/dsh-inline-media-viewer"
  },
  "dsh": { "profile": { "bundles": ["…", "dsh-inline-media-viewer"] } }
}
```

The plugin mounts itself (host RPC channel + client projection + settings
section) via its `cordis.patch.yml`.

## User settings

Settings panel → **媒体预览 / Media preview**:

| Field | Default | Range |
| --- | --- | --- |
| Auto-render detected media | on | on/off |
| Max items per turn | 12 | 1–30 |
| Max media height (px) | 380 | 160–1200 |
| ComfyUI address | (built-in default, empty) | `http(s)://host[:port]` |

Values persist in the DSH settings document. Writes are available on loopback
connections; remote browsers read the values but can only hold them for the
session (see SECURITY.md).

The **ComfyUI address** is the origin the host proxy fetches media from. It
accepts `http://host[:port]`, `https://host[:port]`, or bare `host[:port]`
(http assumed); a missing port defaults to 8188 for http and 443 for https,
and credentials/paths/queries are rejected. The local aliases
(`127.0.0.1`/`localhost` on port 8188) stay recognized as ComfyUI URLs, and
the configured origin is recognized too. Leave it empty to use the built-in
default (`http://127.0.0.1:8188`, ComfyUI's standard local address; never
shown in the settings page); a non-empty invalid address fails remote proxy
reads with an explicit error instead of silently fetching from elsewhere.
The address must be reachable from the DSH host process — for a
containerized host, use the address as seen from inside the container.

## Development

```bash
node test.mjs          # unit tests (pure helpers only, no deps)
npm test               # same
npm run lint           # syntax-check the host modules
```

- `lib.js` — pure helpers, no runtime deps (unit-testable anywhere).
- `index.js` — host half: RPC channel, ComfyUI proxy, settings registration.
- `client/client.js` — browser half: turn projection, renderer, settings page.

The running web serves the bundled copy; re-build/restart the web profile after
changing sources.

## License

MIT — see [LICENSE](LICENSE).
