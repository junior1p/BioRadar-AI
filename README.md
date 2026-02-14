# 🤖 BioTender - AI × Biology Insights Platform

一个完整的 **AI 驱动内容自动生成系统**，从学术论文到深度分析文章。

自动从 **BioRxiv** 和 **arXiv** 抓取论文 → 用 **OpenAI** 生成文章 → 部署到 **GitHub + Vercel**

```
BioRxiv + ArXiv  
     ↓ (fetch)
Keyword Filter
     ↓ (filter)
OpenAI Generate
     ↓ (generate)
Save as Markdown
     ↓ (save)
GitHub Push → Vercel Deploy 🚀
```

## ✨ 核心特性

- ✅ **完全自动化**: 论文抓取 → 生成 → 保存 → 部署
- ✅ **多源支持**: BioRxiv + arXiv
- ✅ **AI 驱动**: 使用 OpenAI GPT-4 生成深度分析
- ✅ **云端部署**: GitHub Actions + Vercel
- ✅ **定时运行**: 每天自动执行
- ✅ **降级方案**: 无需 API 也能生成

## 📁 项目结构

```
biotender-blog/
├── 📄 静态网站 (HTML)
│   ├── index.html
│   ├── archive.html
│   ├── artwork.html
│   └── about.html
├── 🤖 自动化系统 (Node.js)
│   ├── scripts/autoPost.js
│   ├── content/posts/
│   ├── package.json
│   └── .env.local
├── ☁️ 云端部署
│   ├── vercel.json
│   ├── .github/workflows/
│   └── .gitignore
└── 📚 文档
    ├── README.md (本文)
    ├── SETUP.md
    ├── GITHUB-VERCEL-DEPLOY.md
    └── LICENSE
```

## 🚀 快速开始

### 方式 A：本地运行

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key
cp .env.example .env.local
# 编辑 .env.local，填入 OPENAI_API_KEY

# 3. 运行脚本
npm run auto-post

# 4. 查看生成的文章
ls content/posts/
```

### 方式 B：部署到 GitHub + Vercel

**完整指南：** [GITHUB-VERCEL-DEPLOY.md](GITHUB-VERCEL-DEPLOY.md)

**快速步骤：**

1. 推送到 GitHub
2. 在 Vercel 连接 GitHub 仓库
3. 配置 `OPENAI_API_KEY` 环境变量
4. 完成！自动定时运行

## 🔄 工作流程

```
每天 UTC 08:00 触发
    ↓
GitHub Actions 运行 autoPost.js
    ├─ 抓取论文（BioRxiv + arXiv）
    ├─ 关键词过滤
    ├─ 调用 OpenAI 生成文章
    ├─ 保存为 Markdown
    └─ 提交到 GitHub
        ↓
        新代码推送
        ↓
        Vercel 自动部署
        ↓
        网站更新 🎉
```

## 📝 配置指南

编辑 `.env.local`：

```ini
# OpenAI API
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4          # gpt-4 / gpt-4-turbo / gpt-3.5-turbo

# Git 推送（仅云端）
GIT_PUSH=false              # 本地：false，云端：true

# 输出目录
OUTPUT_DIR=./content/posts
```

## 🧪 测试

```bash
# 测试 API 连接
node test-openai-api.js

# 测试离线生成（不需要 API）
node test-offline-generation.js

# 完整流程
npm run auto-post
```

## 💰 成本估算

基于 OpenAI 定价：

- **gpt-4**: ~$0.10/篇 → 月度 ~$3（30篇）
- **gpt-4-turbo**: ~$0.02/篇 → 月度 ~$0.60
- **gpt-3.5-turbo**: ~$0.005/篇 → 月度 ~$0.15

## 🔒 安全性

- ❌ 不要提交 `.env.local` 到 Git
- ✅ 使用 GitHub Secrets 管理 API Key
- ✅ 定期轮换 Key（建议每 3 个月）

## 📚 完整文档

- [SETUP.md](SETUP.md) - 本地配置详细说明
- [GITHUB-VERCEL-DEPLOY.md](GITHUB-VERCEL-DEPLOY.md) - 云端部署完整指南
- [DEPLOYMENT.md](DEPLOYMENT.md) - 部署状态和故障排查

## 🎯 下一步

1. 在本地运行 `npm run auto-post` 测试
2. 创建 GitHub 仓库并推送代码
3. 连接 Vercel 并配置环境变量
4. 测试定时任务（GitHub Actions）
5. （可选）绑定自定义域名

## 📞 常见问题

**Q: 如何修改生成时间？**  
A: 编辑 `.github/workflows/auto-post.yml` 中的 cron 表达式

**Q: 如何降级到更便宜的模型？**  
A: 编辑 `.env.local`，改为 `OPENAI_MODEL=gpt-3.5-turbo`

**Q: 支持自定义域名吗？**  
A: 是的！在 Vercel 项目设置中添加

**Q: 本地网络无法访问 OpenAI？**  
A: 没关系！部署到 Vercel 后自动解决。或用 VPN/代理

## 📄 许可证

MIT - 详见 [LICENSE](LICENSE)

---

**版本**: 1.0.0 | **最后更新**: 2026-02-14

✨ 一键从学术到魅力！
