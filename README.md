## GitHub Star Manager

基于 Next.js 和 GitHub API 的 Star 仓库管理工具。

## 功能

- **GitHub 同步**：从 GitHub 同步星标仓库到本地数据库
- **AI 分析**：使用 DeepSeek API 分析仓库，生成描述和标签
- **仓库管理**：查看、搜索、删除仓库，支持分页浏览
- **标签管理**：自定义标签，按标签筛选仓库
- **搜索**：支持按仓库名称和描述搜索

## 技术栈

- **前端框架**：Next.js 15 (App Router)
- **UI 组件**：TailwindCSS + Shadcn/ui
- **后端 API**：GitHub REST API
- **数据库**：PostgreSQL (Prisma ORM)
- **AI**：DeepSeek API

## 🚀 部署到 Vercel

一键部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/FanLu1994/github-start-drawer)

### 环境变量配置

在 Vercel 部署时，需要在项目设置中配置以下环境变量：

#### 必需环境变量

- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `GITHUB_TOKEN` - GitHub Personal Access Token
- `DATABASE_URL` - 数据库连接字符串（PostgreSQL）
- `OPERATION_PASSWORD` - 操作密码（同步和分析操作需要）

#### 可选环境变量

**DeepSeek 配置：**
- `DEEPSEEK_BASE_URL` - DeepSeek API 基础 URL（默认：https://api.deepseek.com/v1）
- `DEEPSEEK_MODEL` - 使用的模型（默认：deepseek-chat）
- `DEEPSEEK_TEMPERATURE` - 温度参数（默认：0.7）
- `DEEPSEEK_MAX_TOKENS` - 最大 token 数（默认：2048）
- `DEEPSEEK_STREAMING` - 是否启用流式响应（默认：true）
- `DEEPSEEK_TIMEOUT` - 请求超时时间（默认：30000）

**GitHub 配置：**
- `GITHUB_BASE_URL` - GitHub API 基础 URL（默认：https://api.github.com）
- `GITHUB_TIMEOUT` - 请求超时时间（默认：10000）

### 部署步骤

1. 点击上方「Deploy with Vercel」按钮
2. 使用 GitHub 账号登录 Vercel
3. 导入 `github-start-drawer` 仓库
4. 在环境变量设置中配置上述必需环境变量
5. 点击「Deploy」开始部署

部署完成后，Vercel 会自动为你分配一个域名，你也可以配置自定义域名。