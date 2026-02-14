#!/usr/bin/env node

/**
 * 验证脚本：测试 GPTsAPI 配置
 * 同时验证文本生成和图片生成的配置
 */

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置
const CONFIG = {
  apiKey: process.env.API_KEY || "sk-Nly93d09ec1389c91fcb423a1efbb8a5478737f2b036FAzU",
  apiBaseUrl: "https://api.gptsapi.net",
  textModel: process.env.TEXT_MODEL || "gpt-4.1-mini",
  imageModel: process.env.IMAGE_MODEL || "gemini-2.5-flash-image-hd",
};

console.log("\n" + "═".repeat(60));
console.log("🧪 BioTender GPTsAPI 配置验证");
console.log("═".repeat(60) + "\n");

console.log("📋 配置信息：");
console.log(`  API Base URL: ${CONFIG.apiBaseUrl}`);
console.log(`  API Key: ${CONFIG.apiKey.substring(0, 20)}...${CONFIG.apiKey.substring(-10)}`);
console.log(`  文本模型: ${CONFIG.textModel}`);
console.log(`  图片模型: ${CONFIG.imageModel}`);
console.log("");

// ============================================
// 测试 1: 文本生成
// ============================================

async function testTextGeneration() {
  console.log("🧪 测试 1: 文本生成 (GPT-4.1-mini)");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/v1/chat/completions`, {
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
            content: "简述蛋白质结构预测的核心算法（50字以内）"
          }
        ],
        temperature: 0.7,
        max_tokens: 100
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response");
    }
    
    console.log(`✅ 成功\n📝 回复: ${content}\n`);
    return true;
  } catch (err) {
    console.error(`❌ 失败: ${err.message}\n`);
    return false;
  }
}

// ============================================
// 测试 2: 图片生成（Gemini）
// ============================================

async function testImageGeneration() {
  console.log("🧪 测试 2: 图片生成 (Gemini 2.5 Flash Image HD)");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/v1/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CONFIG.apiKey}`
      },
      body: JSON.stringify({
        model: CONFIG.imageModel,
        prompt: "A minimalist scientific illustration of a protein molecule with AI elements",
        n: 1,
        size: "1024x640"
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      throw new Error("No image URL returned");
    }
    
    console.log(`✅ 成功`);
    console.log(`🖼️  图片 URL: ${imageUrl}\n`);
    return true;
  } catch (err) {
    console.error(`❌ 失败: ${err.message}\n`);
    return false;
  }
}

// ============================================
// 测试 3: 网络连接
// ============================================

async function testNetworkConnection() {
  console.log("🧪 测试 3: 网络连接");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${CONFIG.apiBaseUrl}/health`, {
      method: "GET"
    });
    
    // 即使 404，说明能连接
    console.log(`✅ 成功（HTTP ${response.status}）`);
    console.log(`   能访问 ${CONFIG.apiBaseUrl}\n`);
    return true;
  } catch (err) {
    console.error(`⚠️  警告: 无法连接到 API`);
    console.error(`   错误: ${err.message}`);
    console.error(`   可能的原因：网络问题、API已关闭、域名错误\n`);
    return false;
  }
}

// ============================================
// 主函数
// ============================================

async function main() {
  const results = [];
  
  // 运行测试
  results.push(await testNetworkConnection());
  results.push(await testTextGeneration());
  results.push(await testImageGeneration());
  
  // 汇总结果
  console.log("═".repeat(60));
  console.log("📊 测试结果汇总");
  console.log("═".repeat(60));
  console.log(`网络连接: ${results[0] ? "✅" : "❌"}`);
  console.log(`文本生成: ${results[1] ? "✅" : "❌"}`);
  console.log(`图片生成: ${results[2] ? "✅" : "❌"}`);
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`\n总体: ${passed}/${total} 通过\n`);
  
  if (passed === total) {
    console.log("🎉 所有测试通过！系统已准备好自动发布。");
  } else if (passed > 0) {
    console.log("⚠️  部分测试失败。请检查配置或网络连接。");
  } else {
    console.log("❌ 所有测试失败。请检查 API Key 和网络连接。");
  }
  
  console.log("\n" + "═".repeat(60) + "\n");
  
  process.exit(passed === total ? 0 : 1);
}

main();
