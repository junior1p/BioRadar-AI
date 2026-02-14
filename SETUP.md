# 🔧 方案3 配置完整指南

## 📋 系统要求

- Node.js 16+
- npm 或 yarn
- Git（用于自动推送）
- 网络连接（访问 API）

## 🛠️ 环境配置

### 步骤 1：安装 Node.js

访问 https://nodejs.org，下载 LTS 版本。

验证安装：
```bash
node --version
npm --version
```

### 步骤 2：初始化项目

在项目根目录运行：
```bash
npm install
```

这会安装 `dotenv` 依赖，用于管理环境变量。

### 步骤 3：获取 GLM API Key

#### 3a. 注册账户

1. 访问 https://bigmodel.cn
2. 使用手机号或邮箱注册
3. 完成身份认证（必须）

#### 3b. 创建 API Key

1. 进入 [控制台](https://bigmodel.cn/console)
2. 左侧菜单 → "API Keys"
3. 点击 "新建密钥"
4. 复制显示的 API Key

**⚠️ 重要：**
- API Key 只显示一次，请立即保存
- 不要在代码中硬写 API Key
- 使用 `.env` 文件管理敏感信息

### 步骤 4：配置 .env

1. 复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

2. 编辑 `.env.local`，替换你的 API Key：

```ini
GLM_API_KEY=sk-xxxxxxxxxxxxx
GIT_PUSH=false
```

3. **将 `.env.local` 加入 `.gitignore`**（保护密钥）：

```bash
echo ".env.local" >> .gitignore
```

## 🚀 使用指南

### 基础运行

```bash
npm run auto-post
```

**输出示例：**
```
==================================================
BioTender Auto Post System v1.0
==================================================

📡 Fetching papers...

[BioRxiv] Fetching papers from 2026-02-07 to 2026-02-14...
[BioRxiv] Found 3 papers
[ArXiv] Fetching papers...
[ArXiv] Found 5 papers

📊 Total papers: 8

🔍 Filtering by keywords...

✅ 4 papers passed filter

📄 Selected: AlphaFold3: Predicting Complex Protein Structures...

✍️  Generating article with GLM...

[GLM] Generating article for: AlphaFold3...

[Save] Saved: ./content/posts/2026-02-14-alphafold3-predicting.md

[Git] --skipPush: Set GIT_PUSH=true to enable auto-push

==================================================
✨ Auto post completed!
==================================================
```

### 启用自动 Git Push

1. 编辑 `.env.local`：
```ini
GIT_PUSH=true
```

2. 配置 Git 用户信息（如未配置）：
```bash
git config --global user.name "Max"
git config --global user.email "max@biotender.io"
```

3. 重新运行：
```bash
npm run auto-post
```

## ⏰ 定时运行

### Windows: Task Scheduler

1. 打开"任务计划程序"
2. 创建基本任务
3. 设置触发器（每天早上 8 点）
4. 操作：启动程序
5. 程序：`cmd.exe`
6. 参数：`/c cd f:\BioTender Blog && npm run auto-post`

### Mac/Linux: Crontab

编辑 crontab：
```bash
crontab -e
```

添加定时任务：
```cron
# 每天早上 8 点 UTC 运行
0 8 * * * cd /path/to/biotender-blog && npm run auto-post >> /tmp/biotender-auto.log 2>&1

# 或者使用本地时间（示例：EST 时区 8:00 AM）
0 13 * * * cd /path/to/biotender-blog && npm run auto-post >> /tmp/biotender-auto.log 2>&1
```

### GitHub Actions（推荐）

创建 `.github/workflows/auto-post.yml`：

```yaml
name: Auto Post

on:
  schedule:
    # 每天 UTC 时间 08:00 运行
    - cron: '0 8 * * *'
  workflow_dispatch:  # 允许手动触发

jobs:
  auto-post:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run auto-post
        env:
          GLM_API_KEY: ${{ secrets.GLM_API_KEY }}
          GIT_PUSH: 'true'
        run: npm run auto-post
      
      - name: List generated posts
        if: always()
        run: |
          echo "Generated posts:"
          ls -la content/posts/ || echo "No posts generated"
      
      - name: Upload logs
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: execution-logs
          path: content/posts/
          retention-days: 7
```

**配置 GitHub Secrets：**

1. 进入仓库 Settings → Secrets and variables
2. 创建新的 Secret：`GLM_API_KEY`
3. 值：你的 GLM API Key

## 🧪 测试

### 测试论文抓取

创建 `test-fetch.js`：

```javascript
import fs from "fs";

const { start, end } = {
  start: new Date(Date.now() - 7*24*60*60*1000).toISOString().split("T")[0],
  end: new Date().toISOString().split("T")[0]
};

console.log(`Testing BioRxiv API from ${start} to ${end}...`);

const url = `https://api.biorxiv.org/details/biorxiv/${start}/${end}/1`;
fetch(url).then(r => r.json()).then(json => {
  console.log(`Found ${(json.collection || []).length} papers`);
  console.log(JSON.stringify(json.collection[0], null, 2));
}).catch(e => console.error(e.message));
```

运行：
```bash
node test-fetch.js
```

### 测试 GLM API

创建 `test-glm.js`：

```javascript
const apiKey = process.env.GLM_API_KEY;

if (!apiKey) {
  console.error("Error: GLM_API_KEY not set");
  process.exit(1);
}

console.log("Testing GLM API...");

fetch("https://open.bigmodel.cn/api/paas/v4/message", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: "glm-4",
    messages: [{ role: "user", content: "Hello" }]
  })
}).then(r => r.json()).then(json => {
  if (json.choices && json.choices[0]) {
    console.log("✅ GLM API works!");
    console.log("Response:", json.choices[0].message.content);
  } else {
    console.error("❌ Invalid response:", json);
  }
}).catch(e => console.error("Error:", e.message));
```

运行：
```bash
export GLM_API_KEY="your-key"  # 或 set GLM_API_KEY=your-key (Windows)
node test-glm.js
```

## 🔧 自定义配置

### 修改过滤关键词

编辑 `scripts/autoPost.js` 第 97 行：

```javascript
function keywordFilter(papers) {
  const keywords = [
    "deep learning",
    "protein",
    // 添加你的关键词
  ];
  // ...
}
```

### 修改生成的文章格式

编辑 `scripts/autoPost.js` 第 160 行的 `prompt`：

```javascript
const prompt = `
你是一位[自定义角色]...
请根据[自定义要求]...
...
`;
```

### 修改输出目录

编辑 `.env.local`：
```ini
OUTPUT_DIR=./content/posts
```

或编辑 `scripts/autoPost.js` 第 13 行：
```javascript
outputDir: process.env.OUTPUT_DIR || "./content/posts"
```

## 📊 监控与日志

### 查看最近生成的文章

```bash
# 列出所有文章
ls -lt content/posts/ | head -10

# 查看最新文章内容
cat content/posts/$(ls -t content/posts/ | head -1)
```

### 保存日志

创建 `run-with-log.sh`：

```bash
#!/bin/bash
LOGFILE="logs/auto-post-$(date +%Y-%m-%d-%H%M%S).log"
mkdir -p logs
npm run auto-post | tee "$LOGFILE"
```

运行：
```bash
chmod +x run-with-log.sh
./run-with-log.sh
```

## 🚨 常见问题排查

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| `GLM_API_KEY is undefined` | 环境变量未设置 | 检查 `.env.local` 是否存在且包含正确的 Key |
| API 返回 401 | API Key 错误或过期 | 重新生成 API Key |
| 无法连接 BioRxiv/ArXiv | 网络问题或 API 限流 | 检查网络，稍后重试 |
| Git Push 失败 | 权限问题或远程配置 | 运行 `git auth login` 重新认证 |
| 生成的文章质量差 | GLM Prompt 不合适 | 调整 Prompt 参数 |

## ✅ 验证清单

- [ ] Node.js 已安装
- [ ] `npm install` 已运行
- [ ] `.env.local` 已创建和配置
- [ ] GLM API Key 已验证可用
- [ ] 测试运行 `npm run auto-post` 成功
- [ ] 文件已生成到 `content/posts/`
- [ ] Git 已配置（如启用自动推送）

完成以上步骤后，你的自动化系统就可以运行了！🎉
