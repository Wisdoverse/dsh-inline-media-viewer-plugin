window.__ModuleLoader__.load({
  id: "@wisdoverse/dsh-inline-media-viewer",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const { createElement: h, useEffect, useMemo, useState } = React;
    const CHANNEL = "/inline-media";
    const ENDPOINT = "read";
    const DISPLAY_CAP = 12;
    const SETTINGS_NAMESPACE = "inline-media";
    // Empty config = the host-side built-in default
    // (http://127.0.0.1:8188, ComfyUI's standard local address).
    const COMFY_DEFAULT_URL = "";
    const DEFAULT_SETTINGS = Object.freeze({ autoRender: true, displayCap: DISPLAY_CAP, imageMaxPx: 380, comfyUrl: COMFY_DEFAULT_URL });
    let settingsScope = null;

    function clampInt(raw, min, max, fallback) {
      const n = Number.parseInt(String(raw), 10);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(max, Math.max(min, n));
    }

    function readSettings() {
      if (settingsScope === null) return DEFAULT_SETTINGS;
      const snapshot = settingsScope.getSnapshot();
      const value = snapshot && snapshot.value;
      if (!value || typeof value !== "object") return DEFAULT_SETTINGS;
      return {
        autoRender: value.autoRender !== false,
        displayCap: clampInt(value.displayCap, 1, 30, DEFAULT_SETTINGS.displayCap),
        imageMaxPx: clampInt(value.imageMaxPx, 160, 1200, DEFAULT_SETTINGS.imageMaxPx),
        comfyUrl: typeof value.comfyUrl === "string" && value.comfyUrl.trim() !== ""
          ? value.comfyUrl.trim().slice(0, 512)
          : DEFAULT_SETTINGS.comfyUrl,
      };
    }
    const MEDIA_EXTENSIONS = new Set([
      "png", "jpg", "jpeg", "webp", "gif", "avif", "bmp",
      "mp4", "webm", "mov", "m4v", "mkv", "avi", "ogv",
      "mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "opus",
    ]);
    const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "mkv", "avi", "ogv"]);
    const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac", "opus"]);
    const COMFY_HOSTS = new Set(["127.0.0.1", "localhost"]);
    const COMFY_PORTS = new Set(["8188"]);

    function extensionOf(source) {
      try {
        const url = new URL(source);
        const filename = url.searchParams.get("filename");
        const target = filename || url.pathname;
        const dot = target.lastIndexOf(".");
        return dot < 0 ? "" : target.slice(dot + 1).toLowerCase();
      } catch (_error) {
        const target = source.split(/[?#]/, 1)[0];
        const dot = target.lastIndexOf(".");
        return dot < 0 ? "" : target.slice(dot + 1).toLowerCase();
      }
    }

    function mediaKind(source) {
      const ext = extensionOf(source);
      if (!MEDIA_EXTENSIONS.has(ext)) return null;
      if (VIDEO_EXTENSIONS.has(ext)) return "video";
      if (AUDIO_EXTENSIONS.has(ext)) return "audio";
      return "image";
    }

    function cleanCandidate(value) {
      return value
        .trim()
        .replace(/^[`'"(<\[]+/, "")
        .replace(/[`'">)\],;:.!?]+$/, "");
    }

    function extractCandidates(text) {
      const found = [];
      const seen = new Set();
      let directory = "";
      const ext = Array.from(MEDIA_EXTENSIONS).join("|");
      const directories = new Set(Array.from(text.matchAll(
        /[`'"]((?:\/|\.\.?\/|[\w.-]+\/)[^`'"\n]*[\/\\])[`'"]/g,
      ), (match) => cleanCandidate(match[1])));
      const soleDirectory = directories.size === 1 ? directories.values().next().value : "";
      const add = (raw) => {
        const source = cleanCandidate(raw);
        const kind = mediaKind(source);
        if (!kind || seen.has(source)) return;
        seen.add(source);
        found.push({ source, kind });
      };

      let plain = text.replace(/!?\[[^\]]*\]\(([^)]+)\)/g, (match, source) => {
        add(source);
        return " ".repeat(match.length);
      });
      plain = plain.replace(/`([^`\n]+)`/g, (match, source) => {
        const value = cleanCandidate(source);
        if (/[/\\]$/.test(value)) directory = value;
        else {
          const base = directory || soleDirectory;
          add(base && !/[/\\]/.test(value) ? `${base}${value}` : value);
        }
        return " ".repeat(match.length);
      });
      plain = plain.replace(/https?:\/\/[^\s<>"'`]+/gi, (source) => {
        add(source);
        return " ".repeat(source.length);
      });

      if (soleDirectory) {
        const filenamePattern = new RegExp(String.raw`[\x60'"]([^\x60'"/\\\n]+\.(?:${ext})(?:\?[^\x60'"\s]*)?)[\x60'"]`, "gi");
        for (const match of text.matchAll(filenamePattern)) add(`${soleDirectory}${match[1]}`);
      }

      const pathPattern = new RegExp(
        String.raw`(?:\/|\.\.?\/|[\w.-]+\/)[^\s<>"'\x60()\[\]{}]+?\.(?:${ext})(?:\?[^\s<>"'\x60]*)?`,
        "gi",
      );
      for (const match of plain.matchAll(pathPattern)) add(match[0]);
      return found;
    }

    function toolArgumentText(raw) {
      try {
        const text = [];
        const visit = (value) => {
          if (typeof value === "string") text.push(value);
          else if (value && typeof value === "object") Object.values(value).forEach(visit);
        };
        visit(JSON.parse(raw));
        return text.join("\n");
      } catch (_error) {
        return raw;
      }
    }

    const mediaMentionsDefinition = {
      kind: "inline-media-mentions",
      match: (event) => {
        if (event.type === "turn/start") return { id: String(event.data.turn), role: "start" };
        if (event.type === "tool/call") return { id: String(event.data.turn), role: "update" };
        return null;
      },
      start: (_context, match) => ({ turn: match.event.data.turn, texts: [] }),
      update: (context, match) => typeof match.event.data.arguments !== "string" ? context.state : {
        ...context.state,
        texts: [...context.state.texts, { seq: match.event.seq, text: toolArgumentText(match.event.data.arguments) }],
      },
      buildLocationData: (context, scope) => scope !== "turn" || context.state === undefined ? null : {
        kind: "turn",
        turn: context.state.turn,
        key: "inline-media-mentions",
        value: { texts: context.state.texts },
      },
    };

    function selectMedia(owner) {
      const settings = readSettings();
      if (!settings.autoRender) return null;
      const text = [];
      const mentions = owner.turn.data && owner.turn.data.get("inline-media-mentions");
      if (mentions) {
        text.push(...mentions.texts.filter((entry) => entry.seq <= owner.seq).map((entry) => entry.text));
      }
      for (const step of owner.turn.steps) {
        const assistant = step.data.get("assistant-step");
        if (!assistant || !assistant.finalNode || assistant.finalNode.seq > owner.seq || !Array.isArray(assistant.blocks)) continue;
        text.push(...assistant.blocks
          .filter((block) => block && block.kind === "text" && typeof block.text === "string")
          .map((block) => block.text));
      }
      const candidates = extractCandidates(text.join("\n")).slice(0, settings.displayCap);
      return candidates.length === 0 ? null : candidates;
    }

    function normalizeComfyOrigin(input) {
      if (typeof input !== "string") return null;
      let raw = input.trim();
      if (!raw) return null;
      if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `http://${raw}`;
      let url;
      try {
        url = new URL(raw);
      } catch (_error) {
        return null;
      }
      if ((url.protocol !== "http:" && url.protocol !== "https:") || !url.hostname) return null;
      if (url.username || url.password) return null;
      const host = url.hostname;
      if (!/^[a-z0-9.-]+$/i.test(host) && !/^\[[0-9a-f:.%]+\]$/i.test(host)) return null;
      if ((url.pathname !== "" && url.pathname !== "/") || url.search || url.hash) return null;
      const port = url.port || (url.protocol === "https:" ? "443" : "8188");
      return new URL(`${url.protocol}//${host}:${port}`);
    }

    function isComfySource(source, comfyUrl) {
      try {
        const url = new URL(source);
        if (url.protocol !== "http:" && url.protocol !== "https:") return false;
        const port = url.port || (url.protocol === "https:" ? "443" : "80");
        if (COMFY_HOSTS.has(url.hostname) && COMFY_PORTS.has(port)) return true;
        const canonical = normalizeComfyOrigin(comfyUrl || COMFY_DEFAULT_URL);
        const canonicalPort = canonical ? (canonical.port || (canonical.protocol === "https:" ? "443" : "8188")) : "";
        return !!canonical && url.hostname === canonical.hostname && port === canonicalPort;
      } catch (_error) {
        return false;
      }
    }

    function mediaTransport(source, comfyUrl) {
      if (!/^https?:\/\//i.test(source)) return "workspace";
      return isComfySource(source, comfyUrl) ? "comfy-proxy" : "direct";
    }

    function basename(source) {
      try {
        const url = new URL(source);
        const filename = url.searchParams.get("filename");
        if (filename) return filename.split(/[\\/]/).pop();
        return decodeURIComponent(url.pathname.split("/").pop() || source);
      } catch (_error) {
        return source.split(/[\\/]/).pop() || source;
      }
    }

    function MediaCard({ candidate, connection, sessionId, imageMaxPx, comfyUrl }) {
      const proxied = mediaTransport(candidate.source, comfyUrl) !== "direct";
      const [state, setState] = useState(() => proxied
        ? { status: "loading", src: "" }
        : { status: "ready", src: candidate.source });
      const [expanded, setExpanded] = useState(false);

      useEffect(() => {
        if (!proxied) return undefined;
        const controller = new AbortController();
        let active = true;
        setState({ status: "loading", src: "" });
        connection.rpc.call(
          CHANNEL,
          ENDPOINT,
          { source: candidate.source, sessionId },
          controller.signal,
        ).then((result) => {
          if (!active) return;
          if (!result.ok || !result.value || typeof result.value.dataUrl !== "string") {
            setState({ status: "failed", src: "" });
            return;
          }
          setState({ status: "ready", src: result.value.dataUrl });
        }).catch(() => {
          if (active) setState({ status: "failed", src: "" });
        });
        return () => {
          active = false;
          controller.abort();
        };
      }, [candidate.source, connection, proxied, sessionId]);

      useEffect(() => {
        if (!expanded) return undefined;
        const close = (event) => {
          if (event.key === "Escape") setExpanded(false);
        };
        window.addEventListener("keydown", close);
        return () => window.removeEventListener("keydown", close);
      }, [expanded]);

      if (state.status === "failed") return null;
      if (state.status === "loading") {
        return h("div", {
          style: {
            color: "var(--dsw-alias-label-tertiary)",
            fontSize: 12,
            padding: "8px 0",
          },
        }, `正在加载 ${basename(candidate.source)}…`);
      }

      const common = {
        src: state.src,
        title: candidate.source,
        onError: () => setState({ status: "failed", src: "" }),
        style: {
          display: "block",
          width: "100%",
          maxHeight: imageMaxPx || 380,
          borderRadius: 10,
          background: "var(--dsw-alias-bg-layer-2)",
          objectFit: "contain",
        },
      };

      let media;
      if (candidate.kind === "video") {
        media = h("video", { ...common, controls: true, preload: "metadata" });
      } else if (candidate.kind === "audio") {
        media = h("audio", {
          ...common,
          controls: true,
          preload: "metadata",
          style: { ...common.style, minHeight: 42 },
        });
      } else {
        media = h("button", {
          type: "button",
          onClick: () => setExpanded(true),
          "aria-label": `放大 ${basename(candidate.source)}`,
          style: {
            display: "block",
            width: "100%",
            cursor: "zoom-in",
            background: "transparent",
            border: 0,
            padding: 0,
          },
        }, h("img", { ...common, alt: basename(candidate.source), loading: "lazy" }));
      }

      return h("div", {
        style: {
          minWidth: 0,
          overflow: "hidden",
          border: "1px solid var(--dsw-alias-border-l3)",
          borderRadius: 12,
          padding: 8,
        },
      },
      media,
      h("div", {
        title: candidate.source,
        style: {
          color: "var(--dsw-alias-label-tertiary)",
          fontSize: 12,
          overflow: "hidden",
          padding: "6px 2px 0",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }, basename(candidate.source)),
      expanded && candidate.kind === "image" ? h("div", {
        role: "dialog",
        "aria-modal": "true",
        onClick: () => setExpanded(false),
        style: {
          alignItems: "center",
          background: "rgba(0,0,0,.86)",
          cursor: "zoom-out",
          display: "flex",
          inset: 0,
          justifyContent: "center",
          padding: 24,
          position: "fixed",
          zIndex: 9999,
        },
      }, h("img", {
        src: state.src,
        alt: basename(candidate.source),
        style: { maxHeight: "calc(100vh - 48px)", maxWidth: "calc(100vw - 48px)", objectFit: "contain" },
      })) : null);
    }

    function MediaTail({ matched, connection, sessionId }) {
      const settings = readSettings();
      const candidates = useMemo(() => matched.slice(0, settings.displayCap), [matched, settings.displayCap]);
      return h("section", {
        "aria-label": "媒体预览",
        style: { marginTop: 14 },
      },
      h("div", {
        style: {
          color: "var(--dsw-alias-label-tertiary)",
          fontSize: 12,
          marginBottom: 6,
        },
      }, "媒体预览"),
      h("div", {
        style: {
          display: "grid",
          gap: 10,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
        },
      }, candidates.map((candidate) => h(MediaCard, {
        candidate,
        comfyUrl: settings.comfyUrl,
        connection,
        imageMaxPx: settings.imageMaxPx,
        key: candidate.source,
        sessionId,
      }))));
    }

    const SETTINGS_NS = "inlineMedia";
    const SETTINGS_DICT = {
      zh: {
        nav: "媒体预览",
        intro: "调整聊天中内联媒体预览的行为。设置会持久保存到本机设置文档。",
        autoRender: "自动渲染检测到的媒体",
        autoRenderHint: "关闭后仅扫描不展示(仍会扫描消息)。",
        displayCap: "每回合最多显示",
        displayCapHint: "1–30",
        imageMaxPx: "媒体最大高度 (px)",
        imageMaxPxHint: "160–1200",
        comfyUrl: "ComfyUI 地址（可选）",
        comfyUrlHint: "仅用于 ComfyUI 链接；不使用 ComfyUI 可保持为空，本地文件和普通网络 URL 不受影响。",
        comfyUrlError: "地址无效,请使用 http://host:8188 这类格式。",
        reset: "恢复默认",
        writable: "当前连接不可回写:设置仅临时保存在本会话,刷新后恢复默认。",
      },
      en: {
        nav: "Media preview",
        intro: "Tune how inline media is previewed in conversations. Changes persist to the local settings document.",
        autoRender: "Auto-render detected media",
        autoRenderHint: "When off, mentions are still scanned but nothing is shown.",
        displayCap: "Max items per turn",
        displayCapHint: "1–30",
        imageMaxPx: "Max media height (px)",
        imageMaxPxHint: "160–1200",
        comfyUrl: "ComfyUI address (optional)",
        comfyUrlHint: "Used only for ComfyUI links. Leave empty when not using ComfyUI; local files and regular web URLs work independently.",
        comfyUrlError: "Invalid address; use the http://host:8188 form.",
        reset: "Reset to defaults",
        writable: "This connection cannot write settings: values are session-local until a loopback connection is used.",
      },
    };

    function MediaSettingsSection({ scope, t }) {
      const [snap, setSnap] = useState(scope ? scope.getSnapshot() : null);
      useEffect(() => (scope ? scope.subscribe(() => setSnap(scope.getSnapshot())) : undefined), [scope]);
      const stored = snap && snap.value && typeof snap.value === "object" ? snap.value : DEFAULT_SETTINGS;
      const writable = snap ? snap.writable === true : false;
      const comfyUrlValue = String(typeof stored.comfyUrl === "string" ? stored.comfyUrl : DEFAULT_SETTINGS.comfyUrl);
      const comfyUrlInvalid = comfyUrlValue.trim() !== "" && !normalizeComfyOrigin(comfyUrlValue);
      const change = (field, next) => {
        setSnap((prev) => (prev
          ? { ...prev, value: { ...(prev.value || DEFAULT_SETTINGS), [field]: next } }
          : prev));
        if (scope && writable) scope.set(field, next);
      };
      const reset = () => {
        if (!scope || !writable) return;
        setSnap((prev) => (prev ? { ...prev, value: DEFAULT_SETTINGS } : prev));
        scope.unset("autoRender");
        scope.unset("displayCap");
        scope.unset("imageMaxPx");
        scope.unset("comfyUrl");
      };
      const field = (label, hint, node) => h("label", {
        style: { display: "grid", gap: 4, margin: "14px 0 0" },
      },
      h("span", {}, label),
      typeof hint === "string" && h("span", {
        style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12 },
      }, hint),
      node);
      const inputStyle = {
        background: "var(--dsw-alias-bg-layer-2)",
        border: "1px solid var(--dsw-alias-border-l3)",
        borderRadius: 8,
        color: "inherit",
        font: "inherit",
        maxWidth: 280,
        padding: "6px 10px",
      };
      const buttonStyle = {
        background: "var(--dsw-alias-interactive-bg-hover)",
        border: "1px solid var(--dsw-alias-border-l3)",
        borderRadius: 8,
        color: "inherit",
        cursor: "pointer",
        font: "inherit",
        padding: "6px 14px",
      };
      return h("section", { style: { width: "100%" } },
        h("p", { style: { color: "var(--dsw-alias-label-secondary)", fontSize: 13, margin: "0 0 4px" } }, t("intro")),
        field(
          t("autoRender"),
          t("autoRenderHint"),
          h("input", {
            type: "checkbox",
            checked: stored.autoRender !== false,
            disabled: !writable,
            onChange: (event) => change("autoRender", event.target.checked),
            style: { justifySelf: "start" },
          }),
        ),
        field(
          t("displayCap"),
          t("displayCapHint"),
          h("input", {
            type: "number",
            min: 1,
            max: 30,
            step: 1,
            value: String(clampInt(stored.displayCap, 1, 30, DEFAULT_SETTINGS.displayCap)),
            disabled: !writable,
            onChange: (event) => change("displayCap", clampInt(event.target.value, 1, 30, DEFAULT_SETTINGS.displayCap)),
            style: inputStyle,
          }),
        ),
        field(
          t("imageMaxPx"),
          t("imageMaxPxHint"),
          h("input", {
            type: "number",
            min: 160,
            max: 1200,
            step: 1,
            value: String(clampInt(stored.imageMaxPx, 160, 1200, DEFAULT_SETTINGS.imageMaxPx)),
            disabled: !writable,
            onChange: (event) => change("imageMaxPx", clampInt(event.target.value, 160, 1200, DEFAULT_SETTINGS.imageMaxPx)),
            style: inputStyle,
          }),
        ),
        field(
          t("comfyUrl"),
          t("comfyUrlHint"),
          h(React.Fragment, null,
            h("input", {
              type: "text",
              value: comfyUrlValue,
              disabled: !writable,
              maxLength: 512,
              spellCheck: false,
              autoComplete: "off",
              placeholder: "http://host:8188",
              onChange: (event) => change("comfyUrl", String(event.target.value)),
              style: inputStyle,
            }),
            comfyUrlInvalid && h("span", {
              style: { color: "var(--dsw-alias-state-error-primary)", fontSize: 12 },
            }, t("comfyUrlError")),
          ),
        ),
        h("div", { style: { alignItems: "center", display: "flex", gap: 12, marginTop: 18 } },
          h("button", { type: "button", onClick: reset, disabled: !writable, style: buttonStyle }, t("reset")),
          !writable && h("span", { style: { color: "var(--dsw-alias-label-tertiary)", fontSize: 12 } }, t("writable")),
        ));
    }

    const name = "dsh-inline-media-viewer";
    const inject = ["slots", "connection", "settingsScope", "locale", "uiConversation"];

    function apply(ctx) {
      const connection = ctx.get("connection");
      ctx.uiConversation.events.register(mediaMentionsDefinition);
      ctx.effect(() => ctx.locale.register(SETTINGS_NS, SETTINGS_DICT), "inline-media: dictionaries");
      const t = ctx.locale.bind(SETTINGS_NS);
      const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
      settingsScope = scope;
      ctx.slots.inject("conversation.chat.turnTail", () => ctx.slots.register({
        name: "conversation.chat.turnTail",
        select: selectMedia,
        inject: () => ({ connection }),
      }, MediaTail));
      ctx.slots.inject("settings.section", () => ctx.slots.register({
        name: "settings.section",
        id: "inline-media",
        order: 25,
        label: () => t("nav"),
        locale: SETTINGS_NS,
        inject: () => ({ scope }),
      }, MediaSettingsSection));
    }

    exports.apply = apply;
    exports.inject = inject;
    exports.name = name;
    exports.testing = Object.freeze({ extractCandidates, mediaMentionsDefinition, mediaTransport, selectMedia, toolArgumentText });
    return module.exports;
  },
});
