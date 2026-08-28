<h1 align="center">dsh-inline-media-viewer</h1>

<p align="center">
  <strong>为 DeepSeek Harness Web 提供内联图像、视频和音频预览</strong>
</p>

<p align="center">
  <a href="CHANGELOG.md"><img alt="最新标签" src="https://img.shields.io/github/v/tag/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square&amp;label=version"></a>
  <a href="LICENSE"><img alt="许可证" src="https://img.shields.io/github/license/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square"></a>
  <a href="package.json"><img alt="主要语言" src="https://img.shields.io/github/languages/top/Wisdoverse/dsh-inline-media-viewer-plugin?style=flat-square"></a>
  <a href="#配置"><img alt="支持 ComfyUI" src="https://img.shields.io/badge/ComfyUI-supported-ff6f00?style=flat-square"></a>
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>简体中文</strong>
</p>

将 DSH 对话中出现的媒体路径和 URL 安全地转换为内联预览，无需再从聊天日志中复制路径。

```text
https://…/view?filename=frame.png  →  <img>
exports/demo.mp4                   →  <video controls>
audio/sound.mp3                    →  <audio controls>
```

## 目录

- [功能特性](#功能特性)
- [支持的媒体格式](#支持的媒体格式)
- [安装](#安装)
- [配置](#配置)
- [安全设计](#安全设计)
- [开发](#开发)
- [许可证](#许可证)

## 功能特性

| 特性 | 说明 |
| --- | --- |
| 内联渲染 | 在提及媒体的聊天消息下方直接显示图像、视频和音频。 |
| 工作区安全读取 | 使用 `realpath` 解析本地路径，并拒绝目录穿越、工作区外路径和符号链接逃逸。 |
| ComfyUI 代理 | 由服务端从配置的源站获取识别到的 ComfyUI 媒体 URL，使远程用户和 HTTPS 页面也能正常查看。 |
| 资源限制 | 每个文件或响应最大 48 MiB，远程请求最长 20 秒。 |
| 用户控制 | 提供自动渲染、每条消息的媒体数量、媒体高度和 ComfyUI 源站设置。 |

## 支持的媒体格式

| 类型 | 扩展名 |
| --- | --- |
| 图像 | `png`、`jpg`、`jpeg`、`webp`、`gif`、`avif`、`bmp`、`svg` |
| 视频 | `mp4`、`webm`、`mov`、`m4v`、`mkv`、`avi`、`ogv` |
| 音频 | `mp3`、`wav`、`m4a`、`aac`、`ogg`、`oga`、`flac`、`opus` |

## 安装

1. 将插件克隆到 Web profile 可以访问的位置：

   ```bash
   git clone https://github.com/Wisdoverse/dsh-inline-media-viewer-plugin.git \
     /path/to/local-plugins/dsh-inline-media-viewer
   ```

2. 将插件添加到 `profiles/web/package.json`：

   ```jsonc
   {
     "dependencies": {
       "dsh-inline-media-viewer": "link:/path/to/local-plugins/dsh-inline-media-viewer"
     },
     "dsh": {
       "profile": {
         "bundles": ["…", "dsh-inline-media-viewer"]
       }
     }
   }
   ```

3. 重新构建或重启 Web profile。

插件通过 [`cordis.patch.yml`](cordis.patch.yml) 挂载宿主 RPC 通道、客户端投影和设置区域。

## 配置

打开 **设置 → 媒体预览 / Media preview**。

| 设置项 | 默认值 | 可选范围 |
| --- | --- | --- |
| 自动渲染检测到的媒体 | 开启 | 开启 / 关闭 |
| 每条消息的最大媒体数量 | `12` | `1`–`30` |
| 媒体最大高度 | `380 px` | `160`–`1200 px` |
| ComfyUI 源站 | 留空 | `http(s)://host[:port]` |

设置值保存在 DSH 设置文档中。只有回环连接可以写入；远程浏览器可以读取设置，但不能持久化修改。

### ComfyUI 源站

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
| `npm test` | 通过 npm 运行同一套单元测试。 |
| `npm run lint` | 对宿主模块和测试文件执行语法检查。 |

### 项目结构

| 路径 | 职责 |
| --- | --- |
| `index.js` | 宿主 RPC 通道、ComfyUI 代理和设置注册。 |
| `lib.js` | 无依赖的纯辅助函数。 |
| `client/client.js` | 消息投影、媒体渲染器和设置界面。 |
| `cordis.patch.yml` | Bundle 挂载和集成点。 |
| `test.mjs` | 纯辅助函数的单元测试。 |

运行中的 Web profile 使用构建后的副本。修改源文件后，请重新构建或重启 Web profile。

## 许可证

本项目采用 [MIT 许可证](LICENSE)。
