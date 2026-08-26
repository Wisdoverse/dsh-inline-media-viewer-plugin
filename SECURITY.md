# Security

This plugin renders media in a user's chat. It is a **local trust helper**, not
a security boundary: the conversation content it renders is produced by the
same session that views it. What shipping standards demand here is that the
plugin *cannot be turned into a wider primitive* — no arbitrary local file
exfiltration, no arbitrary SSRF, no unbounded memory use.

## Local file reads

- Only the session's workspace root is readable: `realpath(cwd)` + containment
  check (`isInside`) against the resolved target. Symlink escapes, `..`
  traversal, and out-of-workspace paths are rejected.
- Only known media extensions are accepted (MIME map in `lib.js`).
- Size cap: 48 MiB per file.
- The client must supply a valid session id; the workspace root is taken from
  that session's header, never from client input.

## Remote (ComfyUI) proxy

- The fetch target is always the **configured ComfyUI origin** (default
  `http://127.0.0.1:8188`, `comfyUrl` in the `inline-media` settings
  namespace) — never the source host. Chat content can therefore only
  select a path/query on a server the user configured, not an arbitrary
  host.
- A source URL is accepted only when its host:port is a local alias
  (`127.0.0.1` / `localhost` on port 8188) **or** matches the configured
  origin; everything else is rejected before any network I/O.
- The configured address is validated to a bare `http(s)://host[:port]`
  origin: credentials, paths, queries, hashes, and odd hostnames are
  rejected. A non-empty invalid value fails remote reads with an explicit
  error instead of silently retargeting; an empty value uses the built-in
  default.
- Settings writes are loopback-only (see below), so only the local user
  can point the proxy at another host — a remote viewer cannot retarget it.
- `redirect: "error"` — redirects are refused.
- 20 s timeout, 48 MiB response cap, and the response MIME must be
  image/video/audio.

## Transport

- The media channel `/inline-media/read` is registered with the DSH
  connection service (`authority: "trusted-host"`), so it runs under the same
  browser-trust fence and session gating as DSH's own RPC surface.
- The client renderer never receives file system paths back — only `data:`
  URLs — so a hostile session cannot use the channel as a file oracle for
  paths the UI already knows.

## Settings

- Values are normalized client-side and validated server-side against the
  schema (autoRender boolean; displayCap 1–30; imageMaxPx 160–1200;
  comfyUrl string ≤ 512 chars, parsed to a bare origin at use time).
- The settings service only writes back for **loopback** connections; remote
  browsers are read-only, so a remote viewer cannot persist state.

## Known limitations

- Remote (non-loopback) browsers cannot persist settings by design (DSH
  settings writes are loopback-only).
- ComfyUI on a non-standard host/port: set the server address in the settings
  page. The proxy fetches only from that configured origin, so it must be
  reachable from the DSH host process — plain `http://` for a local install,
  `https://` behind a TLS-terminating proxy. The loopback aliases
  (`127.0.0.1`/`localhost` on port 8188) are always accepted as source
  origins; editing `COMFY_HOSTS`/`COMFY_PORTS` is deliberate code surgery,
  not a configuration surface.
