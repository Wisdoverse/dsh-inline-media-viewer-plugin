/**
 * dsh-inline-media-viewer — dependency-free helpers.
 *
 * This module has NO runtime dependencies: unit tests and reviewers can import
 * it anywhere. Integration concerns (RPC channel, settings registration) live
 * in `index.js`.
 *
 * @module dsh-inline-media-viewer/lib
 */

import { extname, isAbsolute, relative, resolve, sep } from "node:path";

export const MAX_BYTES = 48 * 1024 * 1024;

/**
 * Built-in loopback aliases: host:port pairs treated as ComfyUI media URLs
 * even before any address is configured. Every alias is rewritten to the
 * configured origin before fetching (like any other accepted source).
 */
export const COMFY_HOSTS = Object.freeze([
  "127.0.0.1",
  "localhost",
]);

/** ComfyUI's standard HTTP port. */
export const COMFY_PORTS = Object.freeze(["8188"]);

/**
 * Default fetch origin (ComfyUI's standard local address). Point the
 * settings `comfyUrl` at any other server the host process can reach.
 */
export const COMFY_DEFAULT_ORIGIN = "http://127.0.0.1:8188";

export const MIME = Object.freeze({
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  bmp: "image/bmp",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mkv: "video/x-matroska",
  avi: "video/x-msvideo",
  ogv: "video/ogg",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  aac: "audio/aac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  flac: "audio/flac",
  opus: "audio/ogg",
});

export const MEDIA_EXTENSIONS = Object.freeze(Object.keys(MIME));

export function extensionOf(source) {
  try {
    const url = new URL(source);
    const filename = url.searchParams.get("filename");
    if (filename) return extname(filename).slice(1).toLowerCase();
    return extname(url.pathname).slice(1).toLowerCase();
  } catch {
    return extname(source.split(/[?#]/, 1)[0]).slice(1).toLowerCase();
  }
}

export function mimeOf(source) {
  return MIME[extensionOf(source)];
}

export function isInside(root, target) {
  const rel = relative(root, target);
  return rel === "" || (!isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${sep}`));
}

export async function resolveSessionCwd(sessions, sessionQuery, sessionId) {
  const live = sessions.get(sessionId);
  return live ? live.header.cwd : (await sessionQuery.readSession(sessionId)).session.cwd;
}

/**
 * Parse a user-configured ComfyUI address into a canonical origin URL.
 *
 * Accepts `http(s)://host[:port]` or a bare `host[:port]` (http assumed).
 * Credentials, extra path segments, queries, and hashes are rejected so the
 * value is always a bare origin. A missing port defaults to ComfyUI's
 * standard 8188 for http and 443 for https.
 *
 * @param {unknown} input - the configured address string.
 * @returns {URL | null} canonical origin URL, or null when unparseable.
 */
export function normalizeComfyOrigin(input) {
  if (typeof input !== "string") return null;
  let raw = input.trim();
  if (!raw) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `http://${raw}`;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (!url.hostname || url.username || url.password) return null;
  const host = url.hostname;
  if (!/^[a-z0-9.-]+$/i.test(host) && !/^\[[0-9a-f:.%]+\]$/i.test(host)) return null;
  if (url.pathname !== "" && url.pathname !== "/") return null;
  if (url.search || url.hash) return null;
  const port = url.port || (url.protocol === "https:" ? "443" : "8188");
  return new URL(`${url.protocol}//${url.hostname}:${port}`);
}

/**
 * All source origins the proxy accepts for one canonical configured origin:
 * the built-in loopback aliases plus the configured host:port itself.
 *
 * @param {URL} origin - canonical origin from {@link normalizeComfyOrigin}.
 * @returns {Set<string>} accepted "host:port" keys.
 */
export function allowedComfyOrigins(origin) {
  const origins = new Set();
  for (const host of COMFY_HOSTS) {
    for (const port of COMFY_PORTS) origins.add(`${host}:${port}`);
  }
  if (origin instanceof URL) {
    const port = origin.port || (origin.protocol === "https:" ? "443" : "8188");
    origins.add(`${origin.hostname}:${port}`);
  }
  return origins;
}

/**
 * Rewrite an allowed ComfyUI media URL onto the canonical configured origin.
 *
 * The fetch target is ALWAYS the configured origin (default
 * `http://127.0.0.1:8188`) — never the source host — so chat content can only
 * select a path/query on a server the user configured. Source origins are
 * accepted when their host:port is a loopback alias or matches the configured
 * origin.
 *
 * @param {string} source - absolute http(s) URL.
 * @param {string | URL | null} [origin] - configured ComfyUI address
 *   (canonical or parseable string); invalid input falls back to the default.
 * @returns {URL | null} the rewritten fetch URL, or null when not allowed.
 */
export function comfyUrl(source, origin = null) {
  let url;
  try {
    url = new URL(source);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const port = url.port || (url.protocol === "https:" ? "443" : "80");
  const canonical = typeof origin === "string" && origin.trim() !== ""
    ? normalizeComfyOrigin(origin) ?? normalizeComfyOrigin(COMFY_DEFAULT_ORIGIN)
    : origin instanceof URL && origin.hostname
      ? origin
      : normalizeComfyOrigin(COMFY_DEFAULT_ORIGIN);
  if (!allowedComfyOrigins(canonical).has(`${url.hostname}:${port}`)) return null;
  const target = new URL(canonical.href);
  target.pathname = url.pathname;
  target.search = url.search;
  target.hash = "";
  target.username = "";
  target.password = "";
  return target;
}

export const testing = Object.freeze({
  allowedComfyOrigins,
  comfyUrl,
  extensionOf,
  isInside,
  mimeOf,
  normalizeComfyOrigin,
  resolveSessionCwd,
});
