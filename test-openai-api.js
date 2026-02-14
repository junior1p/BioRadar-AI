import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '.env.local') });

const apiKey = process.env.OPENAI_API_KEY || process.argv[2];
const model = process.env.OPENAI_MODEL || "gpt-4";

if (!apiKey) {
  console.error("❌ Error: OPENAI_API_KEY not found");
  console.error("Usage: node test-openai-api.js [API_KEY]");
  console.error("Or set OPENAI_API_KEY in .env.local");
  process.exit(1);
}

console.log("🧪 Testing OpenAI API Connection...\n");
console.log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(-10)}`);
console.log(`Model: ${model}`);
console.log("API Endpoint: https://api.openai.com/v1/chat/completions\n");

const testPrompt = "用一句话解释什么是 AlphaFold。";

console.log(`📤 Sending test request...\n`);

try {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: "user",
          content: testPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    })
  });

  console.log(`📥 Response Status: ${response.status}`);
  
  const data = await response.json();
  
  if (response.ok && data.choices && data.choices[0]) {
    console.log("\n✅ OpenAI API Connection SUCCESS!\n");
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
  console.error("Error Code:", err.code);
  console.error("\nTroubleshooting:");
  console.error("  1. Check your internet connection");
  console.error("  2. Verify API Key is correct in .env.local");
  console.error("  3. Check your OpenAI account billing");
  console.error("  4. Ensure your API Key has appropriate permissions");
  console.error("  5. Check if you need to set an HTTP proxy");
  process.exit(1);
}
