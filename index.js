/**
 * dsh-inline-media-viewer — host half.
 *
 * Serves media bytes for the web client over a dedicated RPC channel
 * (`/inline-media/read`), reading workspace-local files under the calling
 * session's workspace root and proxying ComfyUI media URLs onto the
 * user-configured ComfyUI origin (default: `http://127.0.0.1:8188`,
 * ComfyUI's standard local address). Registers a persistent user settings
 * namespace (`inline-media`) so the client can tune display preferences
 * and the ComfyUI server address.
 *
 * Security model (see SECURITY.md): local reads are confined to the session
 * workspace (realpath + containment), remote reads always fetch from the
 * configured ComfyUI origin (never the source host), and every payload is
 * size-capped before transfer.
 *
 * @module dsh-inline-media-viewer
 */

import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import z from "@deepseek-ai/schemastery";

import { COMFY_DEFAULT_ORIGIN, MAX_BYTES, comfyUrl, isInside, mimeOf, normalizeComfyOrigin, resolveSessionCwd, testing } from "./lib.js";

export { testing } from "./lib.js";

export const name = "dsh-inline-media-viewer";
export const inject = ["connection", "sessions", "sessionQuery", "settings"];

const CHANNEL = "/inline-media";
const ENDPOINT = "read";

/** Persistent user settings namespace for this plugin. */
export const MEDIA_SETTINGS_NAMESPACE = "inline-media";

/** Schema of the user settings section. */
export const MEDIA_SETTINGS_SCHEMA = z.object({
  autoRender: z.boolean().required(),
  displayCap: z.number().step(1).min(1).max(30).required(),
  imageMaxPx: z.number().step(1).min(160).max(1200).required(),
  comfyUrl: z.string().max(512).required(),
});

/** Composition defaults; the user layer overrides these. */
export const MEDIA_SETTINGS_DEFAULTS = Object.freeze({
  autoRender: true,
  displayCap: 12,
  imageMaxPx: 380,
  // Empty means "use the built-in default" (`http://127.0.0.1:8188`),
  // so the settings UI only shows addresses the user actually set.
  comfyUrl: "",
});

function success(value) {
  return { ok: true, value };
}

function failure(message) {
  return {
    ok: false,
    error: { code: "internal", message, details: {} },
  };
}

function messageOf(error) {
  return error instanceof Error ? error.message : String(error);
}

async function responseBytes(response, signal) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BYTES) {
    throw new Error(`media exceeds ${MAX_BYTES} bytes`);
  }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  try {
    for (;;) {
      if (signal.aborted) throw signal.reason;
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) throw new Error(`media exceeds ${MAX_BYTES} bytes`);
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, length);
}

async function readRemote(source, signal, settingsValue) {
  const configured = settingsValue && typeof settingsValue.comfyUrl === "string"
    ? settingsValue.comfyUrl.trim()
    : "";
  const origin = configured === ""
    ? normalizeComfyOrigin(COMFY_DEFAULT_ORIGIN)
    : normalizeComfyOrigin(configured);
  if (!origin) throw new Error("configured ComfyUI address is invalid");
  const url = comfyUrl(source, origin);
  if (!url) throw new Error("remote URL is not an allowed ComfyUI media URL");
  const timeout = AbortSignal.timeout(20_000);
  const combined = AbortSignal.any([signal, timeout]);
  const response = await fetch(url, {
    method: "GET",
    redirect: "error",
    signal: combined,
  });
  if (!response.ok) throw new Error(`ComfyUI returned HTTP ${response.status}`);
  const bytes = await responseBytes(response, combined);
  const mime = mimeOf(source) || response.headers.get("content-type")?.split(";", 1)[0];
  if (!mime || !/^(?:image|video|audio)\//.test(mime)) {
    throw new Error("unsupported media type");
  }
  return { dataUrl: `data:${mime};base64,${bytes.toString("base64")}`, mime };
}

async function readLocal(ctx, source, sessionId) {
  const cwd = await resolveSessionCwd(ctx.sessions, ctx.sessionQuery, sessionId);
  if (!cwd) throw new Error("session working directory is unavailable");
  const mime = mimeOf(source);
  if (!mime) throw new Error("unsupported media extension");

  const root = await realpath(cwd);
  const candidate = isAbsolute(source) ? resolve(source) : resolve(root, source);
  const target = await realpath(candidate);
  if (!isInside(root, target)) throw new Error("media path is outside the session workspace");

  const info = await stat(target);
  if (!info.isFile()) throw new Error("media path is not a file");
  if (info.size > MAX_BYTES) throw new Error(`media exceeds ${MAX_BYTES} bytes`);
  const bytes = await readFile(target);
  return { dataUrl: `data:${mime};base64,${bytes.toString("base64")}`, mime };
}

async function handleRead(ctx, endpoint, payload, signal, resolveSettings) {
  if (endpoint !== ENDPOINT) return failure("unknown inline-media endpoint");
  if (!payload || typeof payload !== "object") return failure("invalid request");
  const { source, sessionId } = payload;
  if (typeof source !== "string" || source.length === 0 || source.length > 4096) {
    return failure("invalid media source");
  }
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    return failure("invalid session id");
  }
  try {
    const value = /^https?:\/\//i.test(source)
      ? await readRemote(source, signal, resolveSettings())
      : await readLocal(ctx, source, sessionId);
    return success(value);
  } catch (error) {
    return failure(messageOf(error));
  }
}

export function apply(ctx) {
  const settings = ctx.settings.register(MEDIA_SETTINGS_NAMESPACE, MEDIA_SETTINGS_SCHEMA, {
    base: MEDIA_SETTINGS_DEFAULTS,
  });
  const resolveSettings = () => settings.get();
  ctx.effect(() => {
    const dispose = ctx.connection.rpc.handle(
      CHANNEL,
      (endpoint, payload, signal) => handleRead(ctx, endpoint, payload, signal, resolveSettings),
    );
    return () => {
      void dispose();
    };
  }, "inline-media: rpc");
}

export { MIME } from "./lib.js";
