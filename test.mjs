/**
 * dsh-inline-media-viewer — unit tests.
 *
 * Pure-helper coverage plus a dependency-free client-registration smoke test.
 * Run with `node test.mjs` or `npm test` from the plugin directory.
 */

import assert from "node:assert/strict";
import { resolve } from "node:path";
import { testing } from "./lib.js";

assert.equal(testing.extensionOf("movie.mp4"), "mp4");
assert.equal(testing.extensionOf("http://127.0.0.1:8188/view?filename=frame.png&type=temp"), "png");
assert.equal(testing.extensionOf("http://localhost:8188/view?filename=clip.mp4&subfolder=&type=output"), "mp4");
assert.equal(testing.mimeOf("exports/demo.webm"), "video/webm");
assert.equal(testing.mimeOf("audio/sound.mp3"), "audio/mpeg");
assert.equal(testing.mimeOf("images/animated.gif"), "image/gif");
assert.equal(testing.mimeOf("no-extension"), undefined);
assert.equal(testing.isInside("/workspace", "/workspace/out/video.mp4"), true);
assert.equal(testing.isInside("/workspace", "/workspace-other/video.mp4"), false);
assert.equal(testing.isInside("/workspace", "/workspace"), true);
assert.equal(testing.isInside("/workspace", "/workspace/../outside.mp4"), false);
let historyReads = 0;
const sessionQuery = {
  async readSession() {
    historyReads += 1;
    return { session: { cwd: "/persisted/workspace" } };
  },
};
assert.equal(
  await testing.resolveSessionCwd(new Map([["live", { header: { cwd: "/live/workspace" } }]]), sessionQuery, "live"),
  "/live/workspace",
);
assert.equal(historyReads, 0);
assert.equal(await testing.resolveSessionCwd(new Map(), sessionQuery, "persisted"), "/persisted/workspace");
assert.equal(historyReads, 1);
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

// The settings section must use the slot framework's locale seat so a live
// DSH language switch re-renders every translated setting, not only the nav.
let clientBundle;
const previousWindow = globalThis.window;
globalThis.window = {
  __ModuleLoader__: {
    load(bundle) {
      clientBundle = bundle;
    },
  },
};

try {
  await import(`./client/client.js?localization-test=${Date.now()}`);
  assert.ok(clientBundle);
  assert.equal(clientBundle.id, "@wisdoverse/dsh-inline-media-viewer");

  const react = {
    createElement: () => null,
    useEffect: () => undefined,
    useMemo: (factory) => factory(),
    useState: (initial) => [initial, () => undefined],
  };
  const plugin = clientBundle.factory((name) => {
    assert.equal(name, "react");
    return react;
  });

  assert.equal(plugin.testing.mediaTransport("outputs/frame.png", ""), "workspace");
  assert.equal(plugin.testing.mediaTransport("https://cdn.example.com/frame.png", ""), "direct");
  assert.equal(
    plugin.testing.mediaTransport("http://127.0.0.1:8188/view?filename=frame.png", ""),
    "comfy-proxy",
  );

  assert.deepEqual(
    plugin.testing.extractCandidates(
      "![poster](/data/dsh/home/xiang test/luke/poster.png)",
    ),
    [{ source: "/data/dsh/home/xiang test/luke/poster.png", kind: "image" }],
  );
  assert.deepEqual(plugin.testing.selectMedia({
    seq: 10,
    turn: {
      steps: [{
        data: new Map([["assistant-step", {
          finalNode: { seq: 10 },
          blocks: [{ kind: "text", text: "luke/poster.png" }],
        }]]),
      }],
    },
  }), [{ source: "luke/poster.png", kind: "image" }]);

  let activeLocale = "zh";
  let dictionaries;
  const registrations = [];
  const scope = { id: "settings-scope" };
  const ctx = {
    conversationEvents: { register: () => undefined },
    effect: (setup) => setup(),
    get: (name) => {
      assert.equal(name, "connection");
      return { id: "connection" };
    },
    locale: {
      bind: (namespace) => {
        assert.equal(namespace, "inlineMedia");
        return (key) => dictionaries[activeLocale][key] ?? key;
      },
      register: (namespace, next) => {
        assert.equal(namespace, "inlineMedia");
        dictionaries = next;
        return () => undefined;
      },
    },
    settingsScope: { bind: () => scope },
    slots: {
      inject: (_name, setup) => setup(),
      register: (options, component) => {
        registrations.push({ component, options });
        return () => undefined;
      },
    },
  };

  plugin.apply(ctx);
  assert.deepEqual(Object.keys(dictionaries).sort(), ["en", "zh"]);
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.zh).sort());

  const settings = registrations.find(({ options }) => options.name === "settings.section");
  assert.ok(settings);
  assert.equal(settings.options.locale, "inlineMedia");
  assert.deepEqual(settings.options.inject(), { scope });
  assert.equal(settings.options.label(), "媒体预览");
  assert.match(dictionaries.zh.comfyUrl, /可选/);
  activeLocale = "en";
  assert.equal(settings.options.label(), "Media preview");
  assert.match(dictionaries.en.comfyUrl, /optional/i);
} finally {
  if (previousWindow === undefined) delete globalThis.window;
  else globalThis.window = previousWindow;
}

console.log("dsh-inline-media-viewer tests passed");
