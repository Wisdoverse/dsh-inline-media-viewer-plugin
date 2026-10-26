<div align="center">

<a id="dsh-inline-media-viewer"></a>

# 🖼️ dsh-inline-media-viewer

**为 DeepSeek Harness Web 提供内联图像、视频和音频预览。**

<a href="README.md">English</a> · <strong>简体中文</strong>

[![版本](https://img.shields.io/github/v/tag/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square&amp;label=version)](CHANGELOG.md)
[![许可证](https://img.shields.io/badge/license-MIT-16a34a.svg?style=flat-square)](LICENSE)
[![主要语言](https://img.shields.io/github/languages/top/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square)](package.json)
[![可选 ComfyUI](https://img.shields.io/badge/ComfyUI-optional-ff6f00?style=flat-square)](#配置)

</div>

**🚀 快速安装**

```sh
dsh plugin --profile web add @wisdoverse/dsh-inline-media-viewer@1.0.12
```

安装后请重启 Web profile。请查看[兼容性和安装详情](#安装)。
如需支持 DSH v0.2.1 的工作目录切换，请[从当前源码安装](#从源码安装)。

[🚀 安装](#安装) · [✨ 功能](#功能特性) · [⚙️ 配置](#配置) · [🐛 反馈](https://github.com/Wisdoverse/dsh-inline-media-viewer-plugin/issues)

## 目录

- [功能特性](#功能特性)
- [支持的媒体格式](#支持的媒体格式)
- [安装](#安装)
- [配置](#配置)
- [安全设计](#安全设计)
- [开发](#开发)
- [许可证](#许可证)

```text
https://…/view?filename=frame.png  →  <img>
exports/demo.mp4                   →  <video controls>
audio/sound.mp3                    →  <audio controls>
```

## 功能特性

| 图标 | 功能 | 说明 |
| --- | --- | --- |
| 🖼️ | 内联渲染 | 在提及媒体的聊天消息下方直接显示图像、视频和音频。 |
| 📁 | 工作区安全读取 | 使用 `realpath` 解析本地路径，并拒绝目录穿越、工作区外路径和符号链接逃逸。 |
| 🔌 | 可选 ComfyUI 代理 | 由服务端从配置的源站获取识别到的 ComfyUI 媒体 URL，使远程用户和 HTTPS 页面也能正常查看。 |
| 📏 | 资源限制 | 每个文件或响应最大 48 MiB，远程请求最长 20 秒。 |
| ⚙️ | 用户控制 | 提供自动渲染、每条消息的媒体数量、媒体高度和可选的 ComfyUI 源站设置。 |

> [!NOTE]
> ComfyUI 不是必需依赖。即使没有安装或运行 ComfyUI，工作区文件和普通 HTTP(S)
> 媒体 URL 仍可正常使用；只有识别为 ComfyUI 的 URL 才会启用代理。

## 支持的媒体格式

| 类型 | 扩展名 |
| --- | --- |
| 图像 | `png`、`jpg`、`jpeg`、`webp`、`gif`、`avif`、`bmp`、`svg` |
| 视频 | `mp4`、`webm`、`mov`、`m4v`、`mkv`、`avi`、`ogv` |
| 音频 | `mp3`、`wav`、`m4a`、`aac`、`ogg`、`oga`、`flac`、`opus` |

浏览器必须支持文件的媒体编码，才能播放该文件。

## 安装

当前源码支持 DSH **v0.2.1-rc.2**（`latest`）和 **v0.2.1-rc.3**（`next`）。
npm 标签核对日期为 **2026-10-26**。
参见 [DSH v0.2.1-rc.3 发布说明](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.3)。
这些改动尚未发布到 npm，请从源码安装。

在 **v0.2.1-rc.2** 和 **v0.2.1-rc.3** 的真实 Web 页面中，Microsoft Edge 上的 28 项页面和接口检查分别全部通过。
PNG、SVG 图片显示正常，MP4、WebM 视频和 WAV 音频实际播放成功。
检查覆盖工作区文件、普通 HTTP 链接和 ComfyUI 代理三条路径。
ComfyUI 响应来自本地 HTTP 测试服务，本轮未运行 ComfyUI 生成工作流。

设置持久化、恢复默认、显示数量限制、自动渲染开关、图片放大和 Escape 关闭均通过检查。
切换 ComfyUI 地址后，已有预览会刷新，并正确切换代理读取和直接 URL 读取。
本地读取使用会话当前工作目录，并恢复已保存的目录切换记录。
宿主拒绝未认证读取、工作区外路径、重定向、超大响应和非媒体响应。
宿主检查还覆盖历史会话、符号链接越界、目录、超大文件，以及旧版 DSH 使用会话初始目录的行为。

下方 npm 命令安装已发布的 **1.0.12**，该版本兼容 DSH **v0.1.7-rc.2** 和 **v0.2.0-rc.2**。
请从 v1.0.11 升级，以移除已废弃的 `settingsScope` 依赖。

### 通过 npm 安装

在 Web profile 中安装并启用 Bundle：

```bash
dsh plugin --profile web add @wisdoverse/dsh-inline-media-viewer@1.0.12
```

安装后重启 Web profile。

### 从源码安装

1. 将插件克隆到 Web profile 可以访问的位置：

   ```bash
   git clone https://github.com/Wisdoverse/dsh-inline-media-viewer-plugin.git \
     /path/to/local-plugins/dsh-inline-media-viewer
   ```

2. 将插件添加到 `profiles/web/package.json`：

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

3. 重新构建或重启 Web profile。

插件通过 [`cordis.patch.yml`](cordis.patch.yml) 挂载宿主 API 路由、客户端投影和设置区域。

## 配置

打开 **设置 → 媒体预览 / Media preview**。

导航名称和全部设置文案会跟随 DSH 当前界面语言，在中文与英文之间实时切换。

| 设置项 | 默认值 | 可选范围 |
| --- | --- | --- |
| 自动渲染检测到的媒体 | 开启 | 开启 / 关闭 |
| 每条消息的最大媒体数量 | `12` | `1`–`30` |
| 媒体最大高度 | `380 px` | `160`–`1200 px` |
| ComfyUI 源站（可选） | 留空 | `http(s)://host[:port]` |

设置值保存在当前 DSH profile 配置中。升级时，DSH 会导入旧 `settings.yaml` 中的 `inline-media` 设置。只有回环连接可以写入；远程浏览器可通过插件的认证 RPC 通道读取这四项设置，但不能修改。

### ComfyUI 源站

- 不使用 ComfyUI 时无需配置此项。
- 留空时使用 `http://127.0.0.1:8188`。
- 支持 `http://host[:port]`、`https://host[:port]` 和不带协议的
  `host[:port]`（默认使用 `http`）。
- HTTP 的默认端口为 `8188`，HTTPS 的默认端口为 `443`。
- 不允许包含凭据、路径、查询字符串或片段。
- 该地址必须能从 DSH 宿主进程访问。如果宿主运行在容器中，请填写容器内部可见的地址。

本地别名（`127.0.0.1:8188` 和 `localhost:8188`）以及配置的源站都会被识别为
ComfyUI 来源。非空的无效地址会明确报错，而不会静默回退到其他目标。

## 安全设计

本插件是本地信任辅助工具，不是通用的文件或网络代理：

- 本地读取仅限当前会话的工作区和已知媒体扩展名。
- 远程读取只能访问配置的 ComfyUI 源站，并拒绝重定向。
- 本地文件和远程响应均限制为最大 48 MiB。
- 设置写入仅允许回环连接。
- 浏览器接收的是 `data:` URL，而不是文件系统路径。

完整的信任模型和已知限制请参阅 [SECURITY.md](SECURITY.md)。

## 开发

### 常用命令

| 命令 | 用途 |
| --- | --- |
| `node test.mjs` | 直接运行无依赖的单元测试。 |
| `node test.mjs --host` | 安装 peer 依赖后运行宿主注册检查。 |
| `npm test` | 通过 npm 运行同一套单元测试。 |
| `npm run lint` | 对宿主模块和测试文件执行语法检查。 |

### 项目结构

| 路径 | 职责 |
| --- | --- |
| `index.js` | 宿主 API 路由、ComfyUI 代理和设置注册。 |
| `lib.js` | 无依赖的辅助函数，包括会话目录解析。 |
| `client/client.js` | 消息投影、媒体渲染器和设置界面。 |
| `cordis.patch.yml` | Bundle 挂载和集成点。 |
| `test.mjs` | 辅助函数和客户端检查，以及可选的宿主检查。 |

运行中的 Web profile 使用构建后的副本。修改源文件后，请重新构建或重启 Web profile。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
