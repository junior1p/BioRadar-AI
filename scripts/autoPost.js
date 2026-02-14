import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ============================================
// 配置
// ============================================

const CONFIG = {
  // API 配置（使用 gptsapi.net 中转站）
  apiKey: process.env.API_KEY || "sk-Nly93d09ec1389c91fcb423a1efbb8a5478737f2b036FAzU",
  apiBaseUrl: "https://api.gptsapi.net",
  
  // 文本生成配置
  textApiUrl: "https://api.gptsapi.net/v1/chat/completions",
  textModel: process.env.TEXT_MODEL || "gpt-4.1-mini",
  
  // 其他配置
  enableGitPush: process.env.GIT_PUSH === "true" || false,
  outputDir: "./content/posts",
  maxResults: 5
};

// ============================================
// 关键词库（第二层：规则过滤）
// ============================================

const KEYWORD_LIBRARIES = {
  // AI 技术关键词
  ai: [
    "deep learning",
    "machine learning",
    "transformer",
    "foundation model",
    "large language model",
    "diffusion",
    "reinforcement learning",
    "graph neural network",
    "neural network",
    "artificial intelligence",
    "ai",
    "llm",
    "gnn",
    "attention mechanism"
  ],
  
  // 生物学关键词
  biology: [
    "protein",
    "genome",
    "crispr",
    "transcriptome",
    "drug",
    "enzyme",
    "antibody",
    "multi-omics",
    "mutation",
    "dna",
    "rna",
    "gene expression",
    "genomics",
    "bioinformatics",
    "molecular",
    "cellular"
  ]
};

// ============================================
// 时间工具
// ============================================

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function getWeekRange() {
  const today = new Date();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return {
    start: formatDate(weekAgo),
    end: formatDate(today)
  };
}

// ============================================
// BioRxiv 抓取
// ============================================

async function fetchBioRxiv() {
  try {
    const { start, end } = getWeekRange();
    const url = `https://api.biorxiv.org/details/biorxiv/${start}/${end}/1`;
    
    console.log(`[BioRxiv] Fetching papers from ${start} to ${end}...`);
    
    const res = await fetch(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "BioTender-AutoPost/1.0"
      }
    });
    
    if (!res.ok) {
      console.warn(`[BioRxiv] API returned ${res.status}, skipping`);
      return [];
    }
    
    const json = await res.json();
    const papers = (json.collection || []).slice(0, CONFIG.maxResults);
    
    console.log(`[BioRxiv] Found ${papers.length} papers`);
    return papers.map(p => ({
      source: "BioRxiv",
      title: p.title || "",
      abstract: p.abstract || "",
      url: p.doi || "",
      date: p.date || "",
      authors: p.authors || ""
    }));
  } catch (err) {
    console.error("[BioRxiv] Error:", err.message);
    return [];
  }
}

// ============================================
// ArXiv 抓取（第一层：API 层面优化）
// ============================================

async function fetchArxiv() {
  try {
    // 官方 API 推荐的查询语法：https://info.arxiv.org/help/api/index.html
    // 分类：q-bio.BM（生物分子）| q-bio.GN（基因组）| q-bio.QM（定量方法）| cs.LG（机器学习）| stat.ML
    // 强制逻辑：(分类过滤) AND (AI词) AND (生物词)
    
    const query = encodeURIComponent(
      `(cat:q-bio.* OR cat:cs.LG OR cat:stat.ML) AND ` +
      `(ti:"deep learning" OR ti:"machine learning" OR ti:transformer OR ti:AI OR abs:"deep learning" OR abs:"machine learning") AND ` +
      `(abs:protein OR abs:genome OR abs:drug OR abs:"gene expression" OR abs:crispr)`
    );
    
    const url = `http://export.arxiv.org/api/query?search_query=${query}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=10`;
    
    console.log("[ArXiv] Fetching papers...");
    
    const res = await fetch(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "BioTender-AutoPost/1.0"
      }
    });
    
    if (!res.ok) {
      console.warn(`[ArXiv] API returned ${res.status}, skipping`);
      return [];
    }
    
    const xml = await res.text();
    
    // 简易 XML 解析
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
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
    
    console.log(`[ArXiv] Found ${papers.length} papers`);
    return papers;
  } catch (err) {
    console.error("[ArXiv] Error:", err.message);
    return [];
  }
}

// ============================================
// 关键词过滤（第二层：本地规则过滤，去掉70%噪音）
// ============================================
// 规则：必须同时包含 AI 关键词 AND 生物关键词
// 这确保论文既有技术贡献，也有生物意义

function keywordFilter(papers) {
  return papers.filter(paper => {
    const text = (paper.title + " " + paper.abstract).toLowerCase();
    
    // 检查 AI 关键词（至少一个）
    const hasAI = KEYWORD_LIBRARIES.ai.some(keyword => 
      text.includes(keyword)
    );
    
    // 检查生物关键词（至少一个）
    const hasBiology = KEYWORD_LIBRARIES.biology.some(keyword => 
      text.includes(keyword)
    );
    
    // 强制逻辑：AI AND 生物
    const pass = hasAI && hasBiology;
    
    if (!pass) {
      const reason = !hasAI ? "no AI keywords" : "no biology keywords";
      console.log(`  ❌ Filtered out: "${paper.title.substring(0, 60)}..." (${reason})`);
    }
    
    return pass;
  });
}

// ============================================
// GLM API 生成文章
// ============================================

async function generateMarkdown(paper) {
  try {
    console.log(`[GPT-4.1-mini] Generating article for: ${paper.title.substring(0, 50)}...`);
    
    const prompt = `你是一位专业的AI与生命科学领域的技术作者。请根据以下论文信息写一篇1000-1500字的深度分析文章，适合知识精英阅读。

论文标题：${paper.title}
摘要：${paper.abstract}
来源：${paper.source}

要求：
1. 文章格式为 Markdown，包含标题、导语、主体分析、结论
2. 风格克制专业，避免过度营销和夸张
3. 关键概念要解释清楚
4. 加入批判性思考，不只是转述论文
5. 结尾引发思考而不是宣传

请直接输出Markdown内容，包含一级标题和二级标题的完整文章。`;

    const response = await fetch(CONFIG.textApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.textModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    if (!content) {
      throw new Error("Empty response from API");
    }
    
    return content;
  } catch (err) {
    console.error("[GPT-4.1-mini] Error:", err.message);
    console.log("[GPT-4.1-mini] Using fallback template...");
    
    // 降级方案：使用模板
    return `# ${paper.title}

> 来源：${paper.source} | ${paper.date}

## 核心观点

${paper.abstract}

## 深度分析

该论文在AI与生命科学的交叉领域提出了重要的创新。本文作为BioTender的自动化内容示例，展示了系统化分析的框架。

## 技术意义

理解这类研究有助于把握AI在生命科学中的真实应用边界。

## 后续思考

- 实际应用场景是什么？
- 与现有方案的对比如何？
- 产业化的困难在哪里？

---

*本文由 BioTender 自动化系统生成，基于论文自动分析。*
`;
  }
}

// ============================================
// 保存 Markdown
// ============================================

function saveMarkdownFile(paper, markdown) {
  // 确保输出目录存在
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // 生成文件名
  const dateStr = formatDate(new Date());
  const titleSlug = paper.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .substring(0, 40);
  const filename = `${dateStr}-${titleSlug}.md`;
  const filepath = path.join(CONFIG.outputDir, filename);
  
  // 添加 Front Matter（元数据）
  const frontMatter = `---
title: "${paper.title}"
date: "${new Date().toISOString()}"
source: "${paper.source}"
sourceUrl: "${paper.url}"
readingTime: "8 min"
---

`;
  
  const content = frontMatter + markdown;
  
  fs.writeFileSync(filepath, content, "utf-8");
  console.log(`[Save] Saved: ${filepath}`);
  
  return filepath;
}

// ============================================
// Git 推送
// ============================================

function gitPush(filepath) {
  if (!CONFIG.enableGitPush) {
    console.log("[Git] --skipPush: Set GIT_PUSH=true to enable auto-push");
    return;
  }
  
  try {
    console.log("[Git] Adding files...");
    execSync("git add .");
    
    const dateStr = formatDate(new Date());
    const filename = path.basename(filepath);
    
    console.log("[Git] Committing...");
    execSync(`git commit -m "[auto-post] ${dateStr}: ${filename}"`);
    
    console.log("[Git] Pushing...");
    execSync("git push");
    
    console.log("[Git] ✅ Pushed successfully");
  } catch (err) {
    console.error("[Git] Error:", err.message);
    console.log("[Git] Manual push required");
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  console.log("═".repeat(50));
  console.log("BioTender Auto Post System v2.0");
  console.log("API Provider: GPTsAPI (OpenAI Compatible)");
  console.log("═".repeat(50));
  console.log("");
  
  // 检查 API Key
  if (CONFIG.apiKey.includes("your-") || CONFIG.apiKey.includes("sk-")) {
    console.log("✅ API Key configured");
  } else {
    console.warn("⚠️  Warning: API Key not properly configured!");
    console.warn("   Using default key...\n");
  }
  
  // 抓取论文
  console.log("📡 Fetching papers...\n");
  const biopapers = await fetchBioRxiv();
  const arxivpapers = await fetchArxiv();
  const allPapers = [...biopapers, ...arxivpapers];
  
  console.log(`📊 Total papers: ${allPapers.length}\n`);
  
  // 过滤
  console.log("🔍 Filtering by keywords...\n");
  const filtered = keywordFilter(allPapers);
  
  if (!filtered.length) {
    console.log("❌ No papers match criteria");
    return;
  }
  
  console.log(`✅ ${filtered.length} papers passed filter\n`);
  
  // 选择第一篇
  const selectedPaper = filtered[0];
  console.log(`📄 Selected: ${selectedPaper.title}\n`);
  
  // 生成文章
  console.log("✍️  Generating article with GPT-4.1-mini...\n");
  const markdown = await generateMarkdown(selectedPaper);
  
  // 保存文件
  console.log("");
  const filepath = saveMarkdownFile(selectedPaper, markdown);
  
  // Git 推送
  console.log("");
  gitPush(filepath);
  
  console.log("");
  console.log("═".repeat(50));
  console.log("✨ Auto post completed!");
  console.log("═".repeat(50));
}

// 执行
main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
