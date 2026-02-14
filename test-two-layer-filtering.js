#!/usr/bin/env node

/**
 * 测试脚本：验证两层过滤逻辑
 * 
 * 第一层：ArXiv API 查询优化（强制 AI AND 生物）
 * 第二层：本地关键词库过滤（AI词库 AND 生物词库）
 */

// ============================================
// 关键词库配置
// ============================================

const KEYWORD_LIBRARIES = {
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
// 模拟论文数据
// ============================================

const samplePapers = [
  {
    id: 1,
    title: "Deep Learning for Protein Structure Prediction",
    abstract: "We present a transformer-based model for predicting protein three-dimensional structures using AlphaFold framework.",
    status: "✅ 应该通过（AI + 生物）"
  },
  {
    id: 2,
    title: "CRISPR-Based Gene Editing Approach",
    abstract: "Novel techniques for genome editing using CRISPR technology in mammalian cells.",
    status: "❌ 应该过滤（仅生物，无 AI）"
  },
  {
    id: 3,
    title: "Transformer Models for Language Understanding",
    abstract: "Large language models using attention mechanisms show promise in natural language processing.",
    status: "❌ 应该过滤（仅 AI，无生物）"
  },
  {
    id: 4,
    title: "Machine Learning Accelerates Drug Discovery",
    abstract: "Deep learning neural networks for protein-ligand interaction prediction and drug candidate identification.",
    status: "✅ 应该通过（AI + 生物）"
  },
  {
    id: 5,
    title: "Graph Neural Networks for Molecular Generation",
    abstract: "Using GNN and reinforcement learning to generate novel antibodies and therapeutic proteins.",
    status: "✅ 应该通过（AI + 生物）"
  },
  {
    id: 6,
    title: "Genomic Analysis of Cancer Mutations",
    abstract: "Statistical analysis of genomic variants in cancer samples with traditional bioinformatics methods.",
    status: "❌ 应该过滤（生物词但无 AI 核心词）"
  },
  {
    id: 7,
    title: "Diffusion Models for Protein Sequence Generation",
    abstract: "Novel diffusion-based generative models for protein design and multi-omics integration.",
    status: "✅ 应该通过（AI + 生物）"
  }
];

// ============================================
// 过滤函数（与 autoPost.js 一致）
// ============================================

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
    
    return pass;
  });
}

// ============================================
// 详细分析函数
// ============================================

function analyzeFiltering(papers) {
  console.log("\n" + "═".repeat(70));
  console.log("📊 两层过滤逻辑验证");
  console.log("═".repeat(70) + "\n");
  
  console.log("规则：必须同时包含 AI 关键词 AND 生物关键词\n");
  
  papers.forEach(paper => {
    const text = (paper.title + " " + paper.abstract).toLowerCase();
    
    // 检查 AI 关键词
    const aiMatches = KEYWORD_LIBRARIES.ai.filter(keyword => 
      text.includes(keyword)
    );
    
    // 检查生物关键词
    const bioMatches = KEYWORD_LIBRARIES.biology.filter(keyword => 
      text.includes(keyword)
    );
    
    const hasAI = aiMatches.length > 0;
    const hasBiology = bioMatches.length > 0;
    const pass = hasAI && hasBiology;
    
    console.log(`【论文 ${paper.id}】${pass ? "✅ PASS" : "❌ FAIL"}`);
    console.log(`标题：${paper.title}`);
    
    if (hasAI) {
      console.log(`  🤖 AI词匹配：${aiMatches.slice(0, 3).join(", ")}${aiMatches.length > 3 ? "..." : ""}`);
    } else {
      console.log(`  🤖 AI词匹配：无`);
    }
    
    if (hasBiology) {
      console.log(`  🧬 生物词匹配：${bioMatches.slice(0, 3).join(", ")}${bioMatches.length > 3 ? "..." : ""}`);
    } else {
      console.log(`  🧬 生物词匹配：无`);
    }
    
    console.log(`  期望结果：${paper.status}`);
    console.log("");
  });
}

// ============================================
// 统计结果
// ============================================

function printStats(original, filtered) {
  console.log("═".repeat(70));
  console.log("📈 统计结果");
  console.log("═".repeat(70) + "\n");
  
  console.log(`总输入论文数：${original.length}`);
  console.log(`通过过滤的论文数：${filtered.length}`);
  console.log(`过滤掉的论文数：${original.length - filtered.length}`);
  console.log(`过滤率：${((original.length - filtered.length) / original.length * 100).toFixed(1)}%`);
  
  console.log("\n通过过滤的论文：\n");
  filtered.forEach((p, idx) => {
    console.log(`  ${idx + 1}. ${p.title}`);
  });
  
  console.log("\n" + "═".repeat(70));
}

// ============================================
// 主函数
// ============================================

function main() {
  console.log("\n🧪 BioTender 两层过滤系统验证\n");
  console.log("第一层：ArXiv API 优化");
  console.log("  - 分类过滤：cat:q-bio.* OR cat:cs.LG OR cat:stat.ML");
  console.log("  - 标题匹配：ti:AI/deep learning/machine learning");
  console.log("  - 摘要匹配：abs:protein/genome/drug AND abs:deep learning\n");
  
  console.log("第二层：本地规则过滤");
  console.log("  - AI关键词库（14个词）");
  console.log("  - 生物关键词库（16个词）");
  console.log("  - 强制逻辑：AI词 AND 生物词\n");
  
  // 执行过滤
  analyzeFiltering(samplePapers);
  
  const filtered = keywordFilter(samplePapers);
  printStats(samplePapers, filtered);
  
  // 验证准确性
  console.log("\n✅ 验证准确性\n");
  
  let correct = 0;
  samplePapers.forEach(paper => {
    const passed = filtered.some(p => p.id === paper.id);
    const shouldPass = paper.status.includes("应该通过");
    
    if (passed === shouldPass) {
      correct++;
    } else {
      console.log(`  ⚠️  论文 ${paper.id} 预期：${paper.status.split("（")[0]} 实际：${passed ? "通过" : "过滤"}`);
    }
  });
  
  console.log(`准确率：${correct}/${samplePapers.length} (${(correct/samplePapers.length*100).toFixed(0)}%)\n`);
}

main();
