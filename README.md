<h1 align="center">dsh-inline-media-viewer</h1>

<p align="center">
  <strong>Inline image, video, and audio previews for DeepSeek Harness Web</strong>
</p>

<p align="center">
  <a href="CHANGELOG.md"><img alt="Latest tag" src="https://img.shields.io/github/v/tag/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square&amp;label=version"></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/github/license/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square"></a>
  <a href="package.json"><img alt="Top language" src="https://img.shields.io/github/languages/top/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square"></a>
  <a href="#configuration"><img alt="Optional ComfyUI" src="https://img.shields.io/badge/ComfyUI-optional-ff6f00?style=flat-square"></a>
</p>

<p align="center">
  <strong>English</strong> · <a href="README.zh-CN.md">简体中文</a>
</p>

Turn media paths and URLs mentioned in a DSH conversation into secure inline
previews—without copying them out of the chat log.

```text
https://…/view?filename=frame.png  →  <img>
exports/demo.mp4                   →  <video controls>
audio/sound.mp3                    →  <audio controls>
```

## Contents

- [Features](#features)
- [Supported media](#supported-media)
- [Installation](#installation)
- [Configuration](#configuration)
- [Security](#security)
- [Development](#development)
- [License](#license)

## Features

| Feature | Description |
| --- | --- |
| Inline rendering | Displays images, videos, and audio directly below the chat turn that mentions them. |
| Workspace-safe reads | Resolves local paths with `realpath` and rejects traversal, out-of-workspace paths, and symlink escapes. |
| Optional ComfyUI proxy | Fetches recognized ComfyUI media URLs server-side from the configured origin, including for remote users and HTTPS pages. |
| Bounded transfers | Limits each file or response to 48 MiB and remote requests to 20 seconds. |
| User controls | Provides auto-render, per-turn item limit, media height, and optional ComfyUI origin settings. |

> [!NOTE]
> ComfyUI is not required. Workspace files and regular HTTP(S) media URLs work
> when ComfyUI is not installed or running; its proxy is activated only for
> recognized ComfyUI URLs.

## Supported media

| Type | Extensions |
| --- | --- |
| Images | `png`, `jpg`, `jpeg`, `webp`, `gif`, `avif`, `bmp`, `svg` |
| Video | `mp4`, `webm`, `mov`, `m4v`, `mkv`, `avi`, `ogv` |
| Audio | `mp3`, `wav`, `m4a`, `aac`, `ogg`, `oga`, `flac`, `opus` |

## Installation

### From npm

Install and activate the bundle in your Web profile:

```bash
dsh plugin --profile web add @wisdoverse/dsh-inline-media-viewer
```

Restart the Web profile after installation.

### From source

1. Clone the plugin into a location available to your Web profile:

   ```bash
   git clone https://github.com/Wisdoverse/dsh-inline-media-viewer-plugin.git \
     /path/to/local-plugins/dsh-inline-media-viewer
   ```

2. Add the bundle to `profiles/web/package.json`:

   ```jsonc
   {
     "dependencies": {
       "@wisdoverse/dsh-inline-media-viewer": "link:/path/to/local-plugins/dsh-inline-media-viewer"
     },
     "dsh": {
       "profile": {
         "bundles": ["…", "@wisdoverse/dsh-inline-media-viewer"]
       }
     }
   }
   ```

3. Rebuild or restart the Web profile.

The plugin mounts its host RPC channel, client projection, and settings section
through [`cordis.patch.yml`](cordis.patch.yml).

## Configuration

Open **Settings → 媒体预览 / Media preview**.

The navigation label and all setting copy follow DSH's active UI language and
switch live between English and Chinese.

| Setting | Default | Allowed values |
| --- | --- | --- |
| Auto-render detected media | On | On / off |
| Maximum items per turn | `12` | `1`–`30` |
| Maximum media height | `380 px` | `160`–`1200 px` |
| ComfyUI origin (optional) | Empty | `http(s)://host[:port]` |

Settings are stored in the DSH settings document. Writes are available only on
loopback connections; remote browsers can read settings but cannot persist
changes.

### ComfyUI origin

- Skip this setting entirely if you do not use ComfyUI.
- Leave the field empty to use `http://127.0.0.1:8188`.
- Accepted forms are `http://host[:port]`, `https://host[:port]`, and bare
  `host[:port]` (`http` is assumed).
- The default port is `8188` for HTTP and `443` for HTTPS.
- Credentials, paths, query strings, and fragments are rejected.
- The origin must be reachable from the DSH host process. For a containerized
  host, use the address visible from inside the container.

Local aliases (`127.0.0.1:8188` and `localhost:8188`) and the configured origin
are recognized as ComfyUI sources. A non-empty invalid address fails explicitly
instead of silently falling back to another target.

## Security

The plugin is designed as a local trust helper, not a general-purpose file or
network proxy:

- Local reads are confined to the active session's workspace and known media
  extensions.
- Remote reads can target only the configured ComfyUI origin; redirects are
  refused.
- Local files and remote responses are capped at 48 MiB.
- Settings writes are restricted to loopback connections.
- The browser receives media as `data:` URLs rather than filesystem paths.

See [SECURITY.md](SECURITY.md) for the complete trust model and known
limitations.

## Development

### Commands

| Command | Purpose |
| --- | --- |
| `node test.mjs` | Run the dependency-free unit tests directly. |
| `npm test` | Run the same unit test suite through npm. |
| `npm run lint` | Syntax-check the host modules and test file. |

### Project structure

| Path | Responsibility |
| --- | --- |
| `index.js` | Host RPC channel, ComfyUI proxy, and settings registration. |
| `lib.js` | Pure, dependency-free helpers. |
| `client/client.js` | Turn projection, media renderer, and settings UI. |
| `cordis.patch.yml` | Bundle mounting and integration points. |
| `test.mjs` | Unit tests for the pure helpers. |

The running Web profile serves a bundled copy. Rebuild or restart it after
changing the source files.

## License

Released under the [MIT License](LICENSE).
