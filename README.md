# Multi-Platform Video Uploader / 多平台视频上传助手

<p align="center">
  <img src="docs/logo.png" alt="Logo" width="120">
</p>

<p align="center">
  <strong>🚀 Upload videos to multiple platforms with one click</strong><br>
  <strong>🚀 一键上传视频到多个平台</strong>
</p>

<p align="center">
  Supports Douyin, Kuaishou, Bilibili, Xiaohongshu, WeChat Channels<br>
  支持抖音、快手、B站、小红书、微信视频号
</p>

<p align="center">
  <a href="#features--功能特性">Features</a> •
  <a href="#quick-start--快速开始">Quick Start</a> •
  <a href="#usage--使用方法">Usage</a> •
  <a href="#faq--常见问题">FAQ</a>
</p>

---

## Features / 功能特性

| Feature | 功能 |
|---------|------|
| 📹 Multi-platform support | 多平台支持 |
| 🤖 AI-assisted content generation | AI 辅助生成标题描述 |
| 🔐 Persistent login with cookies | Cookie 持久化登录 |
| 🖥️ Visible browser for manual confirmation | 可视化浏览器操作 |
| 🏷️ Auto-fill tags | 标签自动填充 |
| ⚡ Parallel processing | 多平台同时处理 |

## Supported Platforms / 支持平台

| Platform / 平台 | Status / 状态 | Auto Features / 自动功能 |
|-----------------|---------------|--------------------------|
| Douyin / 抖音 | ✅ | Title, Description, Topics / 标题、描述、话题 |
| Kuaishou / 快手 | ✅ | Description, Topics / 描述、话题 |
| Bilibili / B站 | ✅ | Title, Intro, Tags, Self-made / 标题、简介、标签、自制 |
| Xiaohongshu / 小红书 | ✅ | Title, Content, Topics / 标题、正文、话题 |
| WeChat Channels / 微信视频号 | ✅ | Description, Topics, Original / 描述、话题、原创声明 |

## Quick Start / 快速开始

### Requirements / 环境要求

- [Node.js](https://nodejs.org/) 18+
- Windows 10/11

### Installation / 安装步骤

```bash
# 1. Clone the project / 克隆项目
git clone https://github.com/your-username/multi-platform-uploader.git
cd multi-platform-uploader

# 2. Install dependencies / 安装依赖
npm install

# 3. Install browser / 安装浏览器
npx playwright install chromium

# 4. Start the service / 启动服务
npm run dev
```

### One-Click Start (Windows) / 一键启动

Double-click `启动.bat` to automatically install dependencies and start the service.

双击 `启动.bat` 即可自动完成依赖安装并启动服务。

## Usage / 使用方法

### 1. Login to Platforms / 登录平台

First-time users need to log in to each platform:

首次使用需要登录各平台：

1. Open browser and visit `http://localhost:5173`
2. Click the login button on platform card
3. Complete QR code login in the popup browser
4. Close the browser window after successful login

---

1. 打开浏览器访问 `http://localhost:5173`
2. 点击平台卡片的登录按钮
3. 在弹出的浏览器中完成扫码登录
4. 登录成功后关闭浏览器窗口

### 2. Upload Video / 上传视频

1. Drag and drop video file to the upload area / 拖拽视频文件到上传区域
2. Fill in title and description (or use AI) / 填写标题和描述（或使用 AI 生成）
3. Add tags (optional) / 添加标签（可选）
4. Select platforms to publish / 选择要发布的平台
5. Click "Start Publishing" / 点击"开始发布"

### 3. Manual Confirmation / 手动确认

The script will auto-fill all information but **will NOT click the publish button**. You need to:

脚本会自动填写所有信息，但**不会自动点击发布按钮**。你需要：

1. Check each platform tab / 检查每个平台标签页的内容
2. Manually click publish after confirmation / 确认无误后手动点击发布

## Configuration / 配置说明

### AI Services / AI 服务配置

| Service / 服务 | Get API Key / 获取 API Key |
|----------------|---------------------------|
| OpenAI | [platform.openai.com](https://platform.openai.com/) |
| DeepSeek | [platform.deepseek.com](https://platform.deepseek.com/) |
| Moonshot | [platform.moonshot.cn](https://platform.moonshot.cn/) |
| Ollama | Local, no key needed / 本地运行，无需 Key |

## Project Structure / 项目结构

```
multi-platform-uploader/
├── src/                    # Frontend source / 前端源码
│   ├── components/         # React components / React 组件
│   └── App.jsx            # Main app / 主应用
├── server/                 # Backend service / 后端服务
│   ├── routes/            # API routes / API 路由
│   ├── services/          # Core services / 核心服务
│   │   ├── browserManager.js   # Browser management / 浏览器管理
│   │   └── platformUploader.js # Platform upload / 平台上传
│   ├── cookies/           # Cookie storage / Cookie 存储
│   └── uploads/           # Upload files / 上传文件
├── 启动.bat               # Windows startup script / 启动脚本
├── package.json           # Project config / 项目配置
└── README.md              # Documentation / 说明文档
```

## FAQ / 常见问题

### Q: Shows not logged in after login? / 登录后显示未登录？

Cookie may have expired. Click the "🔄" button on platform card to re-login.

Cookie 可能已过期，点击平台卡片的"🔄"按钮重新登录。

### Q: Upload failed? / 上传失败怎么办？

1. Check network connection / 检查网络连接
2. Confirm you're logged in / 确认已登录对应平台
3. Check console logs / 查看控制台日志

### Q: Always showing tutorial popup? / 每次都有新手指引？

This is normal. The script will try to close it automatically. Close manually if it blocks operation.

这是正常现象，脚本会尝试自动关闭。如果挡住了操作，手动点击关闭即可。

## Contributing / 贡献

Issues and Pull Requests are welcome!

欢迎提交 Issue 和 Pull Request！

## License / 开源协议

[MIT License](LICENSE)

## Disclaimer / 免责声明

This project is for learning and communication purposes only. Please comply with each platform's terms of service. The author is not responsible for any issues arising from the use of this tool.

本项目仅供学习交流使用，请遵守各平台的使用条款。因使用本工具产生的任何问题，作者不承担责任。
