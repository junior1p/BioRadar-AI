import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const apiKey = process.env.GLM_API_KEY || process.argv[2];

if (!apiKey) {
  console.error("❌ Error: GLM_API_KEY not found");
  console.error("Usage: node test-glm-api.js [API_KEY]");
  console.error("Or set in .env.local");
  process.exit(1);
}

console.log("🧪 Testing GLM API Connection...\n");
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(-10)}`);
console.log("API Endpoint: https://open.bigmodel.cn/api/paas/v4/chat/completions\n");

const testPrompt = "用一句话解释什么是 AlphaFold。";

console.log(`📤 Sending test request...\n`);

try {
  const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "glm-5",
      messages: [
        {
          role: "user",
          content: testPrompt
        }
      ],
      thinking: {
        type: "enabled"
      },
      max_tokens: 4096,
      temperature: 1.0
    })
  });

  console.log(`📥 Response Status: ${response.status}`);
  
  const data = await response.json();
  
  if (response.ok && data.choices && data.choices[0]) {
    console.log("\n✅ GLM API Connection SUCCESS!\n");
    console.log("📝 Test Response:");
    console.log(`───────────────────────────────────────`);
    console.log(data.choices[0].message.content);
    console.log(`───────────────────────────────────────\n`);
    console.log("✨ Your API Key is valid and ready to use!");
  } else {
    console.log("\n❌ API Error Response:");
    console.log(JSON.stringify(data, null, 2));
  }
} catch (err) {
  console.error("\n❌ Connection Error:", err.message);
  console.error("\nTroubleshooting:");
  console.error("  1. Check your internet connection");
  console.error("  2. Verify API Key is correct in .env.local");
  console.error("  3. Check if GLM API is accessible in your region");
  process.exit(1);
}
