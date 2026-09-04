# Changelog

## 1.0.6

- Resolve workspace media from persisted session metadata when a historical
  conversation is no longer attached to a live host session.

## 1.0.5

- Register the browser bundle under the scoped package name expected by the
  DSH module loader.

## 1.0.4

- Read media candidates from the standard assistant-step projection so the
  first inline preview renders reliably.
- Avoid extracting duplicate paths from Markdown links, code spans, and URLs.

## 1.0.3

- Clarify and enforce the transport split: workspace files use the DSH host,
  regular HTTP(S) media loads directly, and only recognized ComfyUI URLs use
  the optional proxy.
- Mark ComfyUI as optional throughout the bilingual settings UI and README.

## 1.0.2

- Make the settings navigation and all setting copy react live to DSH's
  English/Chinese UI language through the standard locale slot contract.
- Add a dependency-free client registration test for both locale dictionaries
  and the settings locale namespace.

## 1.0.1

- Publish the plugin as `@wisdoverse/dsh-inline-media-viewer` for one-command
  installation through the DSH plugin manager.
- Align the bundle manifest, package metadata, and bilingual installation
  documentation with the scoped package name.

## 1.0.0

- **Initial public release.** Inline image/video/audio previews in the
  conversation tail (`conversation.chat.turnTail` projection): any media
  path or media URL mentioned in a chat turn renders inline under that
  turn.
- **Workspace-confined local reads** — a path renders only when it
  resolves inside the calling session's workspace root (`realpath` +
  containment; no symlink escapes).
- **Configurable ComfyUI proxy** — media URLs on the local aliases
  (`127.0.0.1`/`localhost` on port 8188) or on the configured server
  address are fetched server-side from the configured origin, with
  redirects refused, a 20 s timeout, and a 48 MiB cap.
- **Settings page** (媒体预览 / Media preview): auto-render toggle,
  per-turn cap (1–30), max media height (160–1200 px), ComfyUI server
  address — persisted through the DSH settings document (loopback
  writes).
- **Pure helpers** in a dependency-free `lib.js` with a zero-dependency
  unit test runner (`node test.mjs`), plus README, SECURITY, and MIT
  LICENSE.
