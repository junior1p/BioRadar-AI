# 📡 ArXiv 和 BioRxiv 抓取逻辑详解

## 概览

系统通过两个独立的 API 获取学术论文，然后合并、过滤、生成分析。

```
BioRxiv API │  ArXiv API
     │      │     │
     └──────┴──────┘
         │
    合并数据
         │
    关键词过滤
         │
    选择最匹配的论文
         │
    生成深度分析文章
```

---

## 1️⃣ BioRxiv 抓取逻辑

### 📌 API 端点

```
https://api.biorxiv.org/details/biorxiv/{start}/{end}/1
```

**参数说明：**
- `{start}` - 开始日期 (YYYY-MM-DD)
- `{end}` - 结束日期 (YYYY-MM-DD)
- `1` - 第 1 页结果

### 🔄 抓取流程

```javascript
// 第 1 步：计算时间范围
const { start, end } = getWeekRange();
// 返回: { start: "2026-02-07", end: "2026-02-14" }

// 第 2 步：发起 HTTP 请求
const res = await fetch(
  `https://api.biorxiv.org/details/biorxiv/${start}/${end}/1`,
  {
    timeout: 10000,
    headers: { "User-Agent": "BioTender-AutoPost/1.0" }
  }
);

// 第 3 步：检查响应状态
if (!res.ok) {
  console.warn(`[BioRxiv] API returned ${res.status}, skipping`);
  return [];
}

// 第 4 步：解析 JSON 数据
const json = await res.json();
// 结构: { collection: [...], total: 123 }

// 第 5 步：取前 5 篇（CONFIG.maxResults）
const papers = (json.collection || []).slice(0, 5);

// 第 6 步：标准化数据结构
return papers.map(p => ({
  source: "BioRxiv",
  title: p.title || "",
  abstract: p.abstract || "",
  url: p.doi || "",
  date: p.date || "",
  authors: p.authors || ""
}));
```

### 📊 返回数据结构

```javascript
{
  source: "BioRxiv",           // 数据源标记
  title: "Protein folding...",  // 论文标题
  abstract: "We present...",    // 论文摘要
  url: "https://doi.org/...",   // DOI 链接
  date: "2026-02-14",           // 发布日期
  authors: "Smith, J., ..."     // 作者列表
}
```

### ⏱️ 时间范围函数

```javascript
function getWeekRange() {
  const today = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  return {
    start: formatDate(weekAgo),    // 7天前
    end: formatDate(today)          // 今天
  };
}

// 示例：2026-02-14 运行时
// { start: "2026-02-07", end: "2026-02-14" }
```

### ✅ BioRxiv 的优势和限制

| 特性 | 说明 |
|------|------|
| **优势** | |
| 专业性 | 仅包含生物学预印本 |
| 质量 | 经过基本审核 |
| 结构化 | JSON 格式，易解析 |
| **限制** | |
| 范围 | 仅限过去 7 天 |
| 数量 | API 限制未明确 |
| 更新 | 可能有滞后 |
| 完整性 | 有些论文缺少摘要 |

### 🔧 可能的改进

**1. 支持分页**
```javascript
// 当前：只取第一页 5 篇
// 改进：支持多页
const pages = 3;  // 获取前 3 页
for (let i = 0; i < pages; i++) {
  const url = `https://api.biorxiv.org/details/biorxiv/${start}/${end}/${i+1}`;
  // ...
}
```

**2. 更灵活的时间范围**
```javascript
// 当前：固定 7 天
// 改进：支持参数化
async function fetchBioRxiv(daysAgo = 7) {
  const weekAgo = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  // ...
}
```

**3. 错误重试**
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (err) {
      if (i < maxRetries - 1) {
        console.log(`Retry ${i + 1}/${maxRetries}...`);
        await sleep(2000);
      }
    }
  }
}
```

---

## 2️⃣ ArXiv 抓取逻辑

### 📌 API 端点

```
http://export.arxiv.org/api/query?search_query={query}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=5
```

**特点：**
- 基于 XML 响应（不是 JSON）
- 支持复杂的查询语法
- 无日期限制

### 🔍 查询语法

```javascript
const query = encodeURIComponent(
  `(cat:q-bio.PE OR cat:q-bio.BM OR cat:q-bio.GN OR cat:cs.AI) 
   AND 
   (all:"protein" OR all:"drug" OR all:"molecule" OR all:"deep learning")`
);
```

**拆解：**

**分类筛选（OR）：**
```
cat:q-bio.PE       生物物理学
cat:q-bio.BM       生物分子
cat:q-bio.GN       遗传学 & 基因组学
cat:cs.AI          人工智能
```

**内容筛选（AND）：**
```
all:"protein"      论文任何位置包含 "protein"
all:"drug"         包含 "drug"
all:"molecule"     包含 "molecule"
all:"deep learning" 包含 "deep learning"
```

### 🔄 抓取流程

```javascript
// 第 1 步：构造查询 URL
const query = encodeURIComponent("(cat:...) AND (all:...)");
const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=5`;

// 第 2 步：发起请求
const res = await fetch(url, {
  timeout: 10000,
  headers: { "User-Agent": "BioTender-AutoPost/1.0" }
});

// 第 3 步：获取 XML 文本
const xml = await res.text();

// 第 4 步：简易 XML 解析（正则表达式）
const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
// 匹配所有 <entry>...</entry> 块

// 第 5 步：数据提取
const papers = entries.map(entry => {
  const titleMatch = entry.match(/<title>(.*?)<\/title>/);
  const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/);
  const urlMatch = entry.match(/<id>(.*?)<\/id>/);
  
  return {
    source: "ArXiv",
    title: titleMatch ? titleMatch[1].trim() : "",
    abstract: summaryMatch ? summaryMatch[1].trim().replace(/\n/g, " ") : "",
    url: urlMatch ? urlMatch[1] : "",
    date: new Date().toISOString().split("T")[0],
    authors: ""
  };
});
```

### 📊 ArXiv XML 响应示例

```xml
<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <id>http://arxiv.org/abs/2404.07883v1</id>
    <title>AlphaFold3: Protein Structure Prediction</title>
    <summary>We present AlphaFold3...</summary>
    <published>2024-04-07T00:00:00Z</published>
    <author>
      <name>Smith, John</name>
    </author>
  </entry>
  <!-- 更多 entry ... -->
</feed>
```

### ⚠️ XML 解析方法

**当前方法：正则表达式**
```javascript
const titleMatch = entry.match(/<title>(.*?)<\/title>/);
```

**优缺点：**
- ✅ 简单快速
- ✅ 无依赖
- ❌ 易出错（嵌套、特殊字符）
- ❌ 不规范

**更好的方法：使用 XML 解析库**
```javascript
// 安装: npm install xml2js
const parser = new xml2js.Parser();
const result = await parser.parseStringPromise(xml);
const entries = result.feed.entry;

entries.forEach(entry => {
  const title = entry.title[0];
  const summary = entry.summary[0];
  const id = entry.id[0];
});
```

### ✅ ArXiv 的优势和限制

| 特性 | 说明 |
|------|------|
| **优势** | |
| 广泛 | 覆盖多个学科 |
| 灵活 | 支持复杂查询 |
| 无限制 | 可获取历史数据 |
| 标准化 | 统一的 XML 格式 |
| **限制** | |
| 速度 | XML 解析较慢 |
| 解析复杂 | XML 格式难处理 |
| API 配额 | 有速率限制 |
| 精准度 | 可能返回不相关结果 |

---

## 3️⃣ 关键词过滤逻辑

两个 API 的数据合并后进行过滤：

```javascript
function keywordFilter(papers) {
  const keywords = [
    "deep learning",
    "machine learning",
    "ai",
    "artificial intelligence",
    "diffusion",
    "transformer",
    "language model",
    "llm",
    "protein",
    "drug discovery",
    "molecule",
    "neural network",
    "neural"
  ];
  
  // 构造正则表达式：keyword1|keyword2|keyword3|...
  const regex = new RegExp(keywords.join("|"), "i");  // i = 不区分大小写
  
  return papers.filter(p => {
    const text = (p.title + " " + p.abstract).toLowerCase();
    return regex.test(text);  // 如果匹配任何关键词，返回 true
  });
}
```

**示例：**
```
论文 1:
  标题: "AlphaFold3: Protein Structure Prediction"
  摘要: "Deep learning model for protein folding"
  → ✅ 匹配 "protein" + "deep learning"

论文 2:
  标题: "A Novel Cooking Technique"
  摘要: "How to improve kitchen efficiency"
  → ❌ 无关键词匹配
```

---

## 4️⃣ 完整数据流

```
BioRxiv API          ArXiv API
  │                    │
  └──► 获取论文 ◄──────┘
       5 篇 + 5 篇
       共 10 篇
         │
         ↓
    合并为数组
    [paper1, paper2, ...]
         │
         ↓
    关键词过滤
    仅保留相关论文
         │
    ↓
  选择最匹配的 1 篇
    (通过 keywordFilter 返回数组[0])
         │
    ↓
  调用 OpenAI 生成分析文章
    (generateMarkdown)
         │
    ↓
  保存为 Markdown
    (content/posts/...)
         │
    ↓
  Git 提交和推送
```

---

## 5️⃣ 性能对比

| 指标 | BioRxiv | ArXiv |
|------|---------|-------|
| **响应速度** | 快 (JSON) | 较慢 (XML) |
| **数据量** | 小 (7天内) | 大 (无限) |
| **精准度** | 高 (专业) | 一般 (广泛) |
| **解析难度** | 易 | 中等 |
| **API 稳定** | 中等 | 很好 |
| **失败重连** | 支持 | 支持 |

---

## 6️⃣ 可能的优化方案

### 方案 A：优化 ArXiv 查询

```javascript
// 当前：宽泛查询
(cat:q-bio.PE OR cat:q-bio.BM OR cat:q-bio.GN OR cat:cs.AI)

// 优化：按优先级分类
const queries = [
  // 第 1 优先级：AI + Biology
  `(cat:q-bio AND cat:cs.AI) AND (all:"deep learning" OR all:"protein")`,
  
  // 第 2 优先级：生物学 AI
  `cat:q-bio AND (all:"AI" OR all:"machine learning")`,
  
  // 第 3 优先级：相关内容
  `(all:"AlphaFold" OR all:"drug discovery")`
];

// 按优先级查询，返回前 N 篇
```

### 方案 B：实现缓存机制

```javascript
const cache = new Map();

async function fetchWithCache(source, key, fetcher) {
  if (cache.has(key)) {
    console.log(`Cache hit for ${key}`);
    return cache.get(key);
  }
  
  const data = await fetcher();
  cache.set(key, data);
  
  // 1 小时后清除缓存
  setTimeout(() => cache.delete(key), 60 * 60 * 1000);
  
  return data;
}
```

### 方案 C：智能去重

```javascript
function deduplicatePapers(papers) {
  const seen = new Set();
  const unique = [];
  
  for (const paper of papers) {
    // 用标题作为唯一标识
    const key = paper.title.toLowerCase().trim();
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(paper);
    }
  }
  
  return unique;
}
```

### 方案 D：更好的 XML 解析

```javascript
// 使用 xml2js 库替代正则表达式
import * as xml2js from 'xml2js';

const parser = new xml2js.Parser();
const result = await parser.parseStringPromise(xml);

const entries = result.feed.entry || [];
const papers = entries.map(entry => ({
  source: "ArXiv",
  title: entry.title[0],
  abstract: entry.summary[0],
  url: entry.id[0],
  date: new Date().toISOString().split("T")[0],
  authors: entry.author
    ? entry.author.map(a => a.name[0]).join(", ")
    : ""
}));
```

---

## 7️⃣ 故障排查

### BioRxiv 常见问题

**问题 1：API 返回 404**
```
原因：日期范围错误或格式不对
解决：确保日期格式是 YYYY-MM-DD

验证：
console.log(start);  // "2026-02-07"
console.log(end);    // "2026-02-14"
```

**问题 2：返回空数组**
```
原因：该周期内无发布论文
解决：扩大搜索范围

修改 getWeekRange() 返回更长时间段
或改为 14 天、30 天
```

### ArXiv 常见问题

**问题 1：XML 解析错误**
```
原因：正则表达式不够健壮
解决：使用 xml2js 库

npm install xml2js
```

**问题 2：查询语法错误**
```
原因：URL 编码问题
解决：确保使用 encodeURIComponent()

const query = encodeURIComponent("...");
```

**问题 3：API 速率限制**
```
错误：HTTP 503 Service Unavailable
解决：
1. 添加 User-Agent
2. 降低查询频率
3. 查询少一些结果（max_results=5）
```

---

## 📋 总结表格

| 方面 | BioRxiv | ArXiv |
|------|---------|-------|
| **数据来源** | 生物预印本 | 多学科 |
| **API 格式** | JSON | XML |
| **时间范围** | 最近 7 天 | 无限 |
| **查询方式** | 日期范围 | 关键词 |
| **响应速度** | 快 | 较慢 |
| **首选用途** | 生物领域最新 | 交叉领域搜索 |

---

这就是 BioTender 的双源论文抓取系统！两个 API 互补，最大化覆盖面和精准度。 🎯
