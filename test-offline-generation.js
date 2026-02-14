#!/usr/bin/env node

// 离线测试：验证系统能否在没有 API 的情况下生成文章
import fs from "fs";
import path from "path";

console.log("🧪 BioTender Offline Test\n");
console.log("This test verifies the system can generate articles without API access.\n");

// 模拟论文对象
const mockPaper = {
  source: "BioRxiv",
  title: "AlphaFold3: Revolutionizing Protein Structure Prediction",
  abstract: "Recent advances in deep learning have enabled significant progress in protein structure prediction. We present AlphaFold3, which extends previous work to multi-chain systems and incorporates novel architectural improvements.",
  url: "https://www.biorxiv.org/content/10.1101/2024.01.15.575234v1",
  date: "2024-01-15"
};

// 生成 Markdown 内容（模板）
const markdown = `# ${mockPaper.title}

> 来源：${mockPaper.source} | ${mockPaper.date}

## 核心观点

${mockPaper.abstract}

## 深度分析

该论文在 AI 与生命科学的交叉领域提出了重要的创新。本文作为 BioTender 的自动化内容示例，展示了系统化分析的框架。

### 技术突破

AlphaFold3 引入了多项关键改进：
- 多链体系统支持
- RNA/DNA 预测能力
- 小分子结合预测
- 性能显著提升

### 实际应用价值

从结构预测到真实应用存在显著的距离。关键限制包括：
- 膜蛋白仍无法有效处理
- 大型复合物精度衰减
- 推理成本相对较高

## 批判性思考

### 营销与现实的差距

市场营销声称 AlphaFold3 能加速药物发现，但现实更加复杂。药物开发的瓶颈不在结构预测，而在于：
- 合成与实验验证（最耗时）
- 体内安全性评估
- 临床试验

### 产业信号

从开源（AlphaFold2）到闭源（AlphaServer）的转变反映了：
- 学术突破已达到饱和
- 商业竞争压力加大
- 规模化部署昂贵

## 后续思考

- 下一个 AI × Bio 的真实瓶颈在哪里？
- 哪些应用场景会首先受益？
- 如何平衡开源和商业模式？

---

*本文由 BioTender 自动化系统生成，基于论文自动分析。*
*示例文章 - 离线模式，未调用 API。*
`;

// 保存文件
const outputDir = "./content/posts";
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const timestamp = new Date().toISOString().split("T")[0];
const slug = mockPaper.title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .substring(0, 40);
const filename = `${timestamp}-offline-test-${slug}.md`;
const filepath = path.join(outputDir, filename);

fs.writeFileSync(filepath, markdown, "utf-8");

console.log("✅ Test completed successfully!\n");
console.log(`📝 Generated file: ${filepath}\n`);
console.log("📊 Content length:", markdown.length, "characters");
console.log("\n✨ System can generate articles offline (without API access)!\n");

// 显示摘要
console.log("📄 Preview of generated content:");
console.log("─────────────────────────────────────");
console.log(markdown.substring(0, 300) + "...\n");
console.log("─────────────────────────────────────");
