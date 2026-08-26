/**
 * dsh-inline-media-viewer — unit tests.
 *
 * Pure-helper coverage only; integration (RPC channel, settings registration)
 * is exercised by the running web composition. Run with `node test.mjs` or
 * `npm test` from the plugin directory (no runtime dependencies needed).
 */

import assert from "node:assert/strict";
import { resolve } from "node:path";
import { testing } from "./lib.js";

assert.equal(testing.extensionOf("movie.mp4"), "mp4");
assert.equal(testing.extensionOf("http://127.0.0.1:8188/view?filename=frame.png&type=temp"), "png");
assert.equal(testing.extensionOf("http://localhost:8188/view?filename=clip.mp4&subfolder=&type=output"), "mp4");
assert.equal(testing.mimeOf("exports/demo.webm"), "video/webm");
assert.equal(testing.mimeOf("audio/sound.mp3"), "audio/mpeg");
assert.equal(testing.mimeOf("no-extension"), undefined);
assert.equal(testing.isInside("/workspace", "/workspace/out/video.mp4"), true);
assert.equal(testing.isInside("/workspace", "/workspace-other/video.mp4"), false);
assert.equal(testing.isInside("/workspace", "/workspace"), true);
assert.equal(testing.isInside("/workspace", "/workspace/../outside.mp4"), false);
// Default origin: ComfyUI's standard local address; loopback aliases are
// accepted and rewritten onto it.
assert.equal(
  testing.comfyUrl("http://127.0.0.1:8188/view?filename=frame.png").toString(),
  "http://127.0.0.1:8188/view?filename=frame.png",
);
assert.equal(
  testing.comfyUrl("http://localhost:8188/view?filename=frame.png").toString(),
  "http://127.0.0.1:8188/view?filename=frame.png",
);
assert.equal(testing.comfyUrl("https://example.com/frame.png"), null);
assert.equal(testing.comfyUrl("https://127.0.0.1:8443/frame.png"), null);

// Configured ComfyUI origin (settings-comfyUrl)
assert.equal(String(testing.normalizeComfyOrigin("127.0.0.1:8188")), "http://127.0.0.1:8188/");
assert.equal(String(testing.normalizeComfyOrigin("http://localhost:8188")), "http://localhost:8188/");
assert.equal(String(testing.normalizeComfyOrigin("https://comfy.example.com")), "https://comfy.example.com/");
assert.equal(String(testing.normalizeComfyOrigin("https://comfy.example.com:8443")), "https://comfy.example.com:8443/");
assert.equal(testing.normalizeComfyOrigin(""), null);
assert.equal(testing.normalizeComfyOrigin("   "), null);
assert.equal(testing.normalizeComfyOrigin("ftp://comfy.example.com:8188"), null);
assert.equal(testing.normalizeComfyOrigin("http://user:pw@comfy.example.com:8188"), null);
assert.equal(testing.normalizeComfyOrigin("http://comfy.example.com:8188/path"), null);
assert.equal(testing.normalizeComfyOrigin("http://comfy.example.com:8188?x=1"), null);
assert.equal(testing.normalizeComfyOrigin("http://bad host:8188"), null);
assert.equal(testing.normalizeComfyOrigin("http://host:99999"), null);
assert.ok(
  testing.allowedComfyOrigins(testing.normalizeComfyOrigin("http://comfy.example.com:8188")).has("comfy.example.com:8188"),
);

const CUSTOM_ORIGIN = "http://comfy.example.com:8188";
assert.equal(
  testing.comfyUrl("http://comfy.example.com:8188/view?filename=a.png", CUSTOM_ORIGIN).toString(),
  "http://comfy.example.com:8188/view?filename=a.png",
);
// Loopback aliases are still accepted but rewritten onto the custom origin.
assert.equal(
  testing.comfyUrl("http://127.0.0.1:8188/view?filename=a.png", CUSTOM_ORIGIN).toString(),
  "http://comfy.example.com:8188/view?filename=a.png",
);
// Non-matching hosts and ports stay rejected.
assert.equal(testing.comfyUrl("http://evil.example.com:8188/a.png", CUSTOM_ORIGIN), null);
assert.equal(testing.comfyUrl("http://comfy.example.com:8080/a.png", CUSTOM_ORIGIN), null);
// https-configured origins match through the scheme-aware default port.
const HTTPS_ORIGIN = testing.normalizeComfyOrigin("https://comfy.example.com");
assert.equal(
  testing.comfyUrl("https://comfy.example.com/view?filename=a.png", HTTPS_ORIGIN).toString(),
  "https://comfy.example.com/view?filename=a.png",
);
assert.equal(testing.comfyUrl("http://comfy.example.com:8080/a.png", HTTPS_ORIGIN), null);
assert.equal(testing.isInside(resolve("/tmp/a"), resolve("/tmp/a/b")), true);

console.log("dsh-inline-media-viewer tests passed");