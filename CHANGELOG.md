# Changelog

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
