# dsh-inline-media-viewer

[English](README.md) | 简体中文

为 DeepSeek Harness Web 对话提供持续显示的内联图像、视频和音频预览。
聊天消息中出现的媒体路径或媒体 URL 会直接显示在该消息下方，无需再从日志中复制路径。

```
https://…/view?filename=frame.png        →  <img>
exports/demo.mp4                         →  <video controls>
audio/sound.mp3                          →  <audio controls>
```

## 功能

- **对话内联预览**：支持图像、视频和音频（png/jpg/jpeg/webp/gif/avif/bmp/svg、
  mp4/webm/mov/m4v/mkv/avi/ogv、mp3/wav/m4a/aac/ogg/oga/flac/opus）。
- **限定在工作区内的本地读取**：只有当路径解析后位于当前会话的工作区根目录内时，
  才会渲染对应媒体（通过 `realpath` 和目录包含关系进行校验，并阻止符号链接逃逸）。
- **支持自定义服务器地址的 ComfyUI 代理**：对于本地别名
  （`127.0.0.1:8188` / `localhost:8188`）或设置页中配置的服务器地址所生成的
  ComfyUI 媒体 URL，插件会由服务端从配置的源站获取媒体，因此远程用户和 HTTPS 页面
  也能正常查看。
- **传输限制**：单次传输上限为 48 MiB，远程请求超时为 20 秒。
- **用户设置页**：可设置自动渲染开关、每条消息的媒体数量上限（1–30），以及媒体最大高度
  （160–1200 px）。

## 安装

将插件包添加到 Web profile，然后重启服务：

```jsonc
// profiles/web/package.json
{
  "dependencies": {
    "dsh-inline-media-viewer": "link:/path/to/local-plugins/dsh-inline-media-viewer"
  },
  "dsh": { "profile": { "bundles": ["…", "dsh-inline-media-viewer"] } }
}
```

插件通过 `cordis.patch.yml` 自动挂载自身，包括宿主 RPC 通道、客户端投影和设置区域。

## 用户设置

设置面板 → **媒体预览 / Media preview**：

| 设置项 | 默认值 | 范围 |
| --- | --- | --- |
| 自动渲染检测到的媒体 | 开启 | 开启/关闭 |
| 每条消息的最大媒体数量 | 12 | 1–30 |
| 媒体最大高度（px） | 380 | 160–1200 |
| ComfyUI 地址 | 内置默认值（留空） | `http(s)://host[:port]` |

设置值会保存在 DSH 设置文档中。只有通过回环地址连接时才能写入；远程浏览器可以读取设置，
但设置变更只能在当前会话中临时保留（参见 [SECURITY.md](SECURITY.md)）。

**ComfyUI 地址**是宿主代理获取媒体时使用的源站地址。它支持
`http://host[:port]`、`https://host[:port]` 或不带协议的 `host[:port]`
（默认使用 http）；http 未指定端口时默认为 8188，https 未指定端口时默认为 443。
地址中不允许包含凭据、路径或查询参数。本地别名（`127.0.0.1` / `localhost` 的 8188 端口）
始终会被识别为 ComfyUI URL，配置的源站地址同样会被识别。留空时使用内置默认地址
（`http://127.0.0.1:8188`，即 ComfyUI 的标准本地地址；设置页不会显示该默认值）。
如果填写了无效的非空地址，远程代理读取会明确报错，而不会静默改从其他地址获取。
该地址必须能从 DSH 宿主进程访问；如果宿主运行在容器中，请填写容器内部可访问的地址。

## 开发

```bash
node test.mjs          # 运行单元测试（仅测试纯辅助函数，无依赖）
npm test               # 同上
npm run lint           # 检查宿主模块的语法
```

- `lib.js`：不依赖运行时的纯辅助函数，可在任意环境中进行单元测试。
- `index.js`：宿主端，包括 RPC 通道、ComfyUI 代理和设置注册。
- `client/client.js`：浏览器端，包括消息投影、渲染器和设置页。

运行中的 Web 服务使用构建后打包的副本；修改源代码后，请重新构建或重启 Web profile。

## 许可证

MIT — 参见 [LICENSE](LICENSE)。
