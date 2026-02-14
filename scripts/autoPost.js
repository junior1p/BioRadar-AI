import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const CONFIG = {
  apiKey: process.env.API_KEY || "sk-Nly93d09ec1389c91fcb423a1efbb8a5478737f2b036FAzU",
  textApiUrl: "https://api.gptsapi.net/v1/chat/completions",
  textModel: process.env.TEXT_MODEL || "gpt-4.1-mini",
  enableGitPush: process.env.GIT_PUSH === "true" || false,
  outputDir: "./content/posts",
  postsDir: "./posts",
  maxResults: 5
};

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

async function fetchBioRxiv() {
  try {
    const today = new Date();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const url = "https://api.biorxiv.org/details/biorxiv/" + formatDate(weekAgo) + "/" + formatDate(today) + "/1";
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.collection || []).slice(0, CONFIG.maxResults).map(p => ({
      source: "BioRxiv",
      title: p.title || "",
      abstract: p.abstract || "",
      url: p.doi || "",
      date: p.date || ""
    }));
  } catch (err) {
    console.error("[BioRxiv] Error:", err.message);
    return [];
  }
}

async function fetchArxiv() {
  try {
    const url = "http://export.arxiv.org/api/query?search_query=cat:q-bio.*ORcat:cs.LG&sortBy=submittedDate&sortOrder=descending&start=0&max_results=10";
    const res = await fetch(url);
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
    return entries.map(entry => {
      const t = entry.match(/<title>(.*?)<\/title>/);
      const s = entry.match(/<summary>(.*?)<\/summary>/);
      const u = entry.match(/<id>(.*?)<\/id>/);
      return {
        source: "ArXiv",
        title: t ? t[1].trim() : "",
        abstract: s ? s[1].trim().replace(/\n/g, " ") : "",
        url: u ? u[1] : "",
        date: formatDate(new Date())
      };
    });
  } catch (err) {
    console.error("[ArXiv] Error:", err.message);
    return [];
  }
}

async function generateMarkdown(paper) {
  try {
    console.log("[API] Generating article...");
    const res = await fetch(CONFIG.textApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + CONFIG.apiKey },
      body: JSON.stringify({
        model: CONFIG.textModel,
        messages: [{ role: "user", content: "Analyze this paper:\nTitle: " + paper.title + "\nAbstract: " + paper.abstract + "\nSource: " + paper.source + "\n\nOutput 1000-1500 words in Markdown format." }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    if (!content) throw new Error("Empty response");
    return content;
  } catch (err) {
    console.error("[API] Error, using fallback");
    return "# " + paper.title + "\n\n> Source: " + paper.source + " | " + paper.date + "\n\n" + paper.abstract + "\n\nThis paper presents important innovations in AI and life sciences.";
  }
}

function markdownToHtml(markdown) {
  let html = markdown;
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href=\"$2\">$1</a>");
  html = html.replace(/^(?!<[a-z]).+$/gm, "<p>$&</p>");
  return html;
}

function generatePostHtml(paper, markdown) {
  const htmlContent = markdownToHtml(markdown);
  return "<!doctype html>\n<html lang=\\"zh-CN\\">\n<head>\n<meta charset=\\"utf-8\\" />\n<meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1\\" />\n<title>" + paper.title + "</title>\n<style>\nbody { margin: 0; font-family: sans-serif; }\n.wrap { max-width: 680px; margin: 0 auto; padding: 40px 20px; }\n.topbar { display: flex; justify-content: space-between; padding: 28px 0; }\n.brand { font-size: 24px; font-weight: bold; }\narticle { padding: 40px 0; }\nh1 { font-size: 32px; }\np { line-height: 1.8; }\n</style>\n</head>\n<body>\n<div class=\\"wrap\\">\n<div class=\\"topbar\\">\n  <a href=\\"/index.html\\">BioTender</a>\n</div>\n<article>\n  <h1>" + paper.title + "</h1>\n  " + htmlContent + "\n  <a href=\\"/index.html\\">← Back to Home</a>\n</article>\n</div>\n</body>\n</html>";
}

function saveFiles(paper, markdown) {
  if (!fs.existsSync(CONFIG.outputDir)) fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  if (!fs.existsSync(CONFIG.postsDir)) fs.mkdirSync(CONFIG.postsDir, { recursive: true });

  const dateStr = formatDate(new Date());
  const titleSlug = paper.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 40);
  const basename = dateStr + "-" + titleSlug;

  // Save Markdown
  const mdPath = path.join(CONFIG.outputDir, basename + ".md");
  fs.writeFileSync(mdPath, "---\ntitle: \\"" + paper.title + "\\"\ndate: \\"" + new Date().toISOString() + "\\"\nsource: \\"" + paper.source + "\\"\n---\n\n" + markdown, "utf-8");
  console.log("[Save] Markdown: " + mdPath);

  // Save HTML
  const htmlFilename = basename + ".html";
  const htmlPath = path.join(CONFIG.postsDir, htmlFilename);
  fs.writeFileSync(htmlPath, generatePostHtml(paper, markdown), "utf-8");
  console.log("[Save] HTML: " + htmlPath);

  // Update index.html
  updateIndexHtml(paper, htmlFilename);

  return { mdPath, htmlPath };
}

function updateIndexHtml(paper, htmlFilename) {
  const indexPath = "./index.html";
  let indexContent = fs.readFileSync(indexPath, "utf-8");

  const newPostHtml = "  <div class=\\"post\\">\n    <div class=\\"category\\">" + paper.source + "</div>\n    <h3><a href=\\"/posts/" + htmlFilename + "\\">" + paper.title + "</a></h3>\n    <p>" + paper.abstract.substring(0, 120) + "...</p>\n    <div class=\\"meta\\">" + formatDate(new Date()) + "</div>\n  </div>";

  const placeholder = /<!-- 文章会由自动化系统生成到这里 -->[\s\S]*?<div style="text-align: center; padding: 60px 0; color: var(--soft);">/;

  if (placeholder.test(indexContent)) {
    indexContent = indexContent.replace(
      /<!-- 文章会由自动化系统生成到这里 -->[\s\S]*?<\/div>\n  <\/section>/,
      "<!-- 文章会由自动化系统生成到这里 -->\n" + newPostHtml + "\n</section>"
    );
  } else {
    indexContent = indexContent.replace(
      /(<div class="section-title">Latest Essays<\/div>\n)/,
      "$1\n" + newPostHtml
    );
  }

  fs.writeFileSync(indexPath, indexContent, "utf-8");
  console.log("[Update] index.html");
}


async function main() {
  console.log("BioTender Auto Post v2.0");
  console.log("================================");

  const biopapers = await fetchBioRxiv();
  const arxivpapers = await fetchArxiv();
  const allpapers = biopapers.concat(arxivpapers);

  console.log("Total papers: " + allpapers.length);

  if (!allpapers.length) {
    console.log("No papers found");
    return;
  }

  const selectedPaper = allpapers[0];
  console.log("Selected: " + selectedPaper.title.substring(0, 60));

  const markdown = await generateMarkdown(selectedPaper);
  saveFiles(selectedPaper, markdown);

  console.log("Completed!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
