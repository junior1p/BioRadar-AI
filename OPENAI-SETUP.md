# 🚀 OpenAI API 集成部署指南

## ✅ 已完成的配置

你的系统已从 GLM API 切换到 OpenAI API：

| 项目 | 配置 |
|------|------|
| **API 提供商** | OpenAI (openai.com) |
| **API Key 状态** | ✅ 已配置 |
| **模型** | gpt-4 |
| **端点** | https://api.openai.com/v1/chat/completions |
| **配置文件** | `.env.local` |

## 🔑 API 密钥信息

```
API Key: [YOUR_OPENAI_API_KEY]  # 在 .env.local 中配置
模型: gpt-4 (可选: gpt-4-turbo, gpt-3.5-turbo)
```

## 🌐 网络问题排查

### 问题：无法连接 OpenAI API

**错误提示：** `fetch failed` 或 `Connection refused`

**常见原因：**
1. ❌ 防火墙或公司代理阻止了连接
2. ❌ 地区限制（某些地区无法直接访问 OpenAI）
3. ❌ 网络问题或 DNS 无法解析

### 解决方案

#### 方案 A：使用 VPN（推荐）
```bash
1. 下载 VPN 应用（例如：Clash, Shadowsocks, ExpressVPN）
2. 连接到可以访问 OpenAI 的节点
3. 运行脚本
```

#### 方案 B：配置代理

如果你知道公司或网络的代理地址，可以通过环境变量配置：

**Windows (PowerShell):**
```powershell
$env:HTTP_PROXY="http://proxy.company.com:8080"
$env:HTTPS_PROXY="http://proxy.company.com:8080"
npm run auto-post
```

**Windows (CMD):**
```cmd
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080
npm run auto-post
```

**Linux/Mac:**
```bash
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
npm run auto-post
```

#### 方案 C：使用云环境（最佳选择）

如果本地无法连接，可以使用云环境：

**1️⃣ GitHub Codespaces（推荐）**
- 完全免费的 VS Code 环境
- 位于 Azure 云端，通常可以访问 OpenAI
- 步骤：
  ```
  1. 在 GitHub 上创建此项目的 Fork
  2. 点击 "<> Code" → "Codespaces" → "Create codespace"
  3. 在云环境中运行: npm run auto-post
  ```

**2️⃣ Replit.com**
- 免费的在线编程环境
- 支持 Node.js
- 可访问 OpenAI API

**3️⃣ Railway.app / Render.com**
- 部署平台
- 自动执行定时任务

## ⚙️ 手动测试（无需网络）

即使无法连接 OpenAI API，系统也有降级方案：

### 测试生成文章（使用模板）

```bash
npm run auto-post
```

系统会：
1. ✅ 从 BioRxiv 和 ArXiv 抓取论文
2. ✅ 使用关键词过滤
3. ❌ 跳过 OpenAI API 调用（网络问题）
4. ✅ 使用内置模板生成文章

生成的文章会保存到 `content/posts/`

## 📋 检查清单

### 网络诊断
```bash
# 测试基本网络连接
ping 8.8.8.8

# 测试 DNS 解析
nslookup api.openai.com

# 测试 HTTPS 连接
curl https://www.google.com
```

### 配置检查
- [x] `.env.local` 已创建
- [x] `OPENAI_API_KEY` 已配置
- [x] `OPENAI_MODEL` 已配置（默认 gpt-4）
- [x] `scripts/autoPost.js` 已更新
- [ ] 网络连接正常（待验证）

## 🔄 使用流程

### 如果网络正常：

```bash
cd "f:\BioTender Blog"
npm run auto-post
```

预期结果：
- 抓取论文
- 生成深度分析文章
- 保存到 `content/posts/`

### 如果网络不正常：

```bash
# 使用降级模式（模板生成）
cd "f:\BioTender Blog"
npm run auto-post
```

系统会自动：
- 抓取论文
- 使用内置模板生成文章
- 不调用 OpenAI API

## 📝 模型选择指南

| 模型 | 价格 | 速度 | 质量 | 推荐场景 |
|------|------|------|------|--------|
| gpt-4 | 最高 | 较慢 | 最好 | 深度分析文章 ✅ |
| gpt-4-turbo | 中等 | 快 | 好 | 成本平衡 |
| gpt-3.5-turbo | 最低 | 最快 | 中等 | 快速生成 |

编辑 `.env.local` 切换模型：
```ini
OPENAI_MODEL=gpt-3.5-turbo  # 改为这个更便宜
```

## 💰 成本估算

基于 OpenAI 当前价格（2026年）：

**单篇文章成本：**
- gpt-4: ~$0.10
- gpt-4-turbo: ~$0.02
- gpt-3.5-turbo: ~$0.005

**月度成本（30 篇）：**
- gpt-4: ~$3
- gpt-4-turbo: ~$0.60
- gpt-3.5-turbo: ~$0.15

## 🎯 下一步

### 立即可做：
1. ✅ 检查网络是否能访问 api.openai.com
2. ✅ 如无法访问，配置 VPN 或代理
3. ✅ 或者切换到云环境运行

### 网络正常后：
```bash
npm run auto-post
```

### 启用定时任务：
编辑 `.env.local`：
```ini
GIT_PUSH=true
```

然后设置定时（参考 SETUP.md）

## 📞 故障排查表

| 问题 | 原因 | 解决方案 |
|------|------|--------|
| fetch failed | 无法连接 OpenAI | 检查网络/VPN/代理 |
| 401 Unauthorized | API Key 错误 | 验证 .env.local 中的 Key |
| 429 Rate Limited | 请求过频繁 | 等待或升级账户 |
| 500 Server Error | OpenAI 服务故障 | 稍后重试 |
| 生成内容为空 | API 响应异常 | 检查模型是否正确 |

## 📚 相关文档

- **README.md** - 系统概览
- **SETUP.md** - 配置指南
- **DEPLOYMENT.md** - 部署状态

---

**OpenAI 集成状态**: 🟡 等待网络验证  
**系统版本**: 1.0.0
