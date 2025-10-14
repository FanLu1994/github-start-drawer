🌟 GitHub Star Manager — 智能 Star 管理器

一个基于 Next.js + GitHub API 构建的智能化 GitHub Star 管理平台。
它不仅能让你可视化地浏览、搜索和分类你的 Star 项目，还通过 AI 智能分析与推荐算法，帮助你重新发现那些被你“收藏后遗忘”的宝藏项目。

🚀 项目背景

在 GitHub 上 Star 项目是一种收藏与关注的方式，但：

Star 一多就很难管理；

想找特定项目时搜索效率低；

很多优秀的项目被埋没。

因此，我们希望打造一个能「像管理知识库一样管理你的 Star」的工具。
它不只是展示数据，而是帮助你理解、分类、推荐与探索。

✨ 核心功能
模块	功能描述
🔑 GitHub 登录与授权	使用 OAuth2 登录，安全获取用户 Star 数据
📚 Star 管理	分页展示 Star 项目，支持按语言、时间、仓库名筛选
🔍 智能搜索	基于项目名称、简介、标签、语言的模糊匹配与语义搜索
🧠 智能分类	使用嵌入模型（Embedding）对项目简介聚类，自动生成主题分类（如：AI、Web、DevOps 等）
🎯 智能推荐	基于相似度推荐你可能喜欢的项目
💾 本地缓存与增量更新	避免重复拉取 GitHub API，提高性能与速率限制利用率
💡 可视化视图	按语言、主题、时间线展示收藏趋势
🪄 AI 助手（可选）	接入 LLM，对仓库进行摘要、技术栈分析与学习建议
🧩 技术栈

前端框架：Next.js 15（App Router + Server Actions）

UI 组件库：TailwindCSS + Shadcn/ui

后端 API：GitHub REST / GraphQL API

数据存储：SQLite / PostgreSQL（可选）

智能层：

向量数据库：Chroma / Supabase Vector

嵌入模型：OpenAI Embeddings / HuggingFace Sentence Transformers

推荐算法：语义相似度 + 协同过滤
