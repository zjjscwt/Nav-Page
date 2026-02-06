# Premium Modern Dashboard

一个基于 Next.js 15 构建的个人导航仪表盘。采用玻璃拟态（Glassmorphism） design 风格，支持暗黑模式，并提供强大的组件化管理功能。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fzjjscwt%2FNav-Page&env=ADMIN_PASSWORD,JWT_SECRET,FINNHUB_API_KEY)

## ✨ 特性

- **极致设计**：全动态背景，结合玻璃拟态视觉效果，支持全局主题切换（明亮/黑暗/系统模式）。
- **组件引擎**：内置三个核心实用小组件：
  - **市场行情**：实时追踪股票、基金或加密货币价格。
  - **汇率监控**：自定义货币对，实时获取汇率信息。
  - **倒数日**：管理重要纪念日、项目截止日期。
- **管理模式**：
  - **拖拽排序**：在编辑模态框中通过手感顺滑的拖拽手柄调整组件展示顺序。
  - **可视化编辑**：无需修改代码，直接在 UI 中配置链接、颜色、搜索偏好及组件内容。
  - **安全验证**：基于 JWT 和环境变量的安全管理登录系统。
- **存储方案**：支持 Vercel KV 远程持久化存储，本地开发环境下自动降级为 Mock 模式。

## 🛠️ 技术栈

- **框架**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI 组件库**: [Radix UI](https://www.radix-ui.com/) (Dialog, Popover, etc.)
- **样式**: [Tailwind CSS](https://tailwindcss.com/)
- **图标**: [Lucide React](https://lucide.dev/)
- **拖拽**: [@dnd-kit](https://dndkit.com/)
- **数据获取**: [SWR](https://swr.vercel.app/)
- **存储**: [Vercel KV](https://vercel.com/storage/kv)

## 🚀 部署指南

该项目针对 **Vercel** 平台进行了深度优化，推荐使用 Vercel 一键部署。

### 1. 环境准备

在本地或部署平台准备以下环境变量：

| 变量名 | 说明 | 示例值 |
| :--- | :--- | :--- |
| `ADMIN_PASSWORD` | 管理后台登录密码 | `your_pwd` |
| `JWT_SECRET` | 登录校验密钥（建议随机长字符串） | `f8a2-9kd3...` |
| `FINNHUB_API_KEY` | 股票数据 API Key (申请：[finnhub.io](https://finnhub.io/)) | `d60...` |
| `KV_REST_API_URL` | Vercel KV 的 API 链接 (仅服务器端) | `https://xxxx.upstash.io` |
| `KV_REST_API_TOKEN` | Vercel KV 的访问令牌 (仅服务器端) | `xxxx` |

### 2. 本地开发

```bash
# 安装依赖
npm install

# 创建并配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

### 3. 发布到 Vercel

1. **推送代码**：将项目推送到您的 GitHub/GitLab 仓库。
2. **连接项目**：在 Vercel 控制台导入仓库。
3. **配置 Storage**：在 Vercel 项目面板中点击 "Storage"，创建一个 "KV" 数据库并关联到该项目。
4. **配置环境变量**：在 "Settings -> Environment Variables" 中手动填入 `ADMIN_PASSWORD`、`JWT_SECRET` 和 `FINNHUB_API_KEY`（KV 相关的变量在关联数据库时会自动添加）。
5. **部署成功**：Vercel 会自动完成构建流程。

## 📝 许可证

MIT License. 自由使用、修改及分发。
