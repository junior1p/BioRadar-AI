# 🚀 GitHub + Vercel 部署完全指南

## 📋 前置条件

- [x] GitHub 账户（https://github.com）
- [x] Vercel 账户（https://vercel.com）
- [x] OpenAI API Key
- [x] 本地 Git 配置

## 🔄 部署流程

### 第 1 步：上传项目到 GitHub

#### 1.1 初始化 Git 仓库

```bash
cd "f:\BioTender Blog"
git init
git add .
git commit -m "Initial commit: BioTender blog system"
```

#### 1.2 创建 GitHub 仓库

1. 登录 https://github.com
2. 点击 "+" → "New repository"
3. 仓库名：`biotender-blog`
4. 描述：`AI × Biology Insights Platform`
5. 选择 Public（如果想开源）或 Private
6. 不要初始化 README、.gitignore、License（本地已有）
7. 点击 "Create repository"

#### 1.3 推送到 GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/biotender-blog.git
git branch -M main
git push -u origin main
```

**替换 `YOUR_USERNAME` 为你的 GitHub 用户名**

### 第 2 步：配置 GitHub Secrets

这些是敏感信息，用于 GitHub Actions 自动化。

**步骤：**

1. 进入仓库设置 → Settings → Secrets and variables → Actions
2. 创建以下 Secrets：

**Secret 1: OPENAI_API_KEY**
- 内容：你的 OpenAI API Key
- `sk-proj-5fr01oXh_2TPm7p9...`

**Secret 2: VERCEL_TOKEN**
- 获取方式：
  1. 访问 https://vercel.com/account/tokens
  2. 点击 "Create"
  3. 名称：`GitHub Token`
  4. 复制生成的 Token

**Secret 3: VERCEL_ORG_ID**
- 获取方式：
  1. 访问 https://vercel.com/dashboard
  2. 左侧菜单 → Settings → Domains
  3. 在 URL 中找到组织 ID，或在终端运行：
     ```bash
     vercel env list
     ```

**Secret 4: VERCEL_PROJECT_ID**
- 部署项目后自动生成（见第 3 步）

### 第 3 步：连接 Vercel

#### 3.1 在 Vercel 创建项目

1. 访问 https://vercel.com/dashboard
2. 点击 "Add New..." → "Project"
3. 选择 "Import Git Repository"
4. 搜索并选择 `biotender-blog`
5. 点击 "Import"

#### 3.2 配置环境变量

在 Vercel 项目设置中：

1. Settings → Environment Variables
2. 添加：
   - `OPENAI_API_KEY` = 你的 API Key
   - `GIT_PUSH` = `true`

#### 3.3 连接 GitHub 推送

1. Settings → Git
2. 确保已连接 GitHub
3. 选择自动部署分支：`main`

#### 3.4 获取项目 ID

1. 项目导出后，访问 https://vercel.com/account/tokens
2. 复制项目 ID（或在终端运行 `vercel projects ls`）
3. 将 `VERCEL_PROJECT_ID` 添加到 GitHub Secrets

### 第 4 步：测试自动化

#### 4.1 手动触发 GitHub Action

1. 进入仓库 → Actions 标签
2. 选择 "Auto Post" 工作流
3. 点击 "Run workflow" → "Run workflow"
4. 等待任务完成

**预期结果：**
- ✅ 论文抓取
- ✅ 文章生成（或使用模板）
- ✅ 文件保存
- ✅ Git 提交和推送
- ✅ Vercel 自动部署

#### 4.2 验证部署

1. 访问 Vercel 项目 URL
2. 应能看到网站首页
3. 检查 `content/posts/` 目录有新文章

### 第 5 步：配置定时任务

GitHub Actions 已配置每天 UTC 00:00（北京时间 08:00）运行。

如需修改时间，编辑 `.github/workflows/auto-post.yml`：

```yaml
schedule:
  - cron: '0 8 * * *'  # 修改这行
```

**Cron 表达式格式：** `分 小时 日 月 星期`

常用示例：
- `0 0 * * *` - 每天 00:00 UTC
- `0 8 * * *` - 每天 08:00 UTC
- `0 * * * *` - 每小时
- `0 9 * * 1` - 每周一 09:00 UTC

## 📊 完整工作流程

```
代码推送 → GitHub
    ↓
GitHub Actions auto-post.yml
    ├─ 脚本运行
    ├─ 生成文章
    └─ 提交代码
        ↓
        新代码推送到 GitHub
        ↓
        GitHub Actions deploy.yml
        ├─ 检测推送
        └─ 部署到 Vercel
            ↓
            网站上线 🎉
```

## 🔒 Security Best Practices

### 保护 API Key

1. **不要提交敏感信息到 Git**
   ```bash
   # .env.local 已在 .gitignore 中
   cat .gitignore | grep ".env.local"
   ```

2. **只在 GitHub Secrets 中存储**
   ```
   Settings → Secrets and variables → Actions
   ```

3. **定期轮换 API Key**
   ```
   每 3 个月更新一次 OPENAI_API_KEY
   ```

## 🔧 常见问题排查

### Q: 部署失败，提示 "No build script"

**A:** vercel.json 已配置。如仍失败，检查：
```bash
cat vercel.json
npm install
npm run auto-post
```

### Q: GitHub Action 无权限推送代码

**A:** 检查 GitHub Secrets 中是否有 `GITHUB_TOKEN`（自动提供，无需手动添加）

### Q: OpenAI API 调用失败

**A:** 在 Vercel 环境变量中验证 `OPENAI_API_KEY`

```bash
vercel env ls
```

### Q: 定时任务没有运行

**A:** 检查 GitHub Actions 是否启用：
```
Settings → Actions → General → "Allow all actions and reusable workflows"
```

### Q: 如何手动更新网站？

**A:** 在本地修改后推送：
```bash
git add .
git commit -m "Update content"
git push origin main
```

Vercel 会自动部署。

## 📈 监控和日志

### GitHub Actions 日志

```
仓库 → Actions → 选择最近的运行 → 查看详细日志
```

### Vercel 部署日志

```
Vercel Dashboard → 项目 → Deployments → 查看部署日志
```

## 🎯 自定义域名

### 在 Vercel 添加自定义域名

1. Vercel 项目 → Settings → Domains
2. 添加域名（例如 `biotender.io`）
3. 按提示配置 DNS

### 配置 DNS（以 Godaddy 为例）

1. 登录域名注册商
2. 找到 DNS 管理
3. 添加 CNAME 记录：
   ```
   Name: www
   Value: biotender-blog.vercel.app
   ```

## 📝 推荐工作流

### 日常维护

```bash
# 1. 创建新分支
git checkout -b feature/new-feature

# 2. 做出改动
# ... 编辑文件 ...

# 3. 提交并推送
git add .
git commit -m "描述你的改动"
git push origin feature/new-feature

# 4. 创建 Pull Request
# GitHub 会提示创建 PR
# 等待自动检查通过后，点击 "Merge"

# 5. 自动部署到 Vercel
```

### 紧急修复

```bash
# 直接推送到 main（生产分支）
git add .
git commit -m "HOTFIX: ..."
git push origin main
# Vercel 立即部署
```

## 🚀 性能优化建议

### Vercel 优化

1. **启用 Edge Caching**
   - Settings → Edge Caching
   - 为静态资源设置 1 年缓存

2. **启用 Image Optimization**
   - 自动优化图像大小和格式

3. **Serverless 函数优化**
   - 使用环境变量而非硬编码

### GitHub Actions 优化

1. **使用 NPM 缓存**（已配置）
2. **并行任务**（根据需要调整）

## 📞 支持资源

- GitHub Docs: https://docs.github.com
- Vercel Docs: https://vercel.com/docs
- OpenAI Docs: https://platform.openai.com/docs

---

**部署状态**: ✅ 已准备好绑定 GitHub 和 Vercel  
**版本**: 1.0.0
