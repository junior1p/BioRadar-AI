// 网络连接诊断脚本
import https from 'https';

console.log("🔍 Network Diagnostic Test\n");

// 测试基本 HTTPS 连接
console.log("1️⃣ Testing HTTPS connectivity...");

https.get("https://www.google.com", (res) => {
  console.log(`✅ HTTPS works (Status: ${res.statusCode})`);
  testOpenAI();
}).on('error', (err) => {
  console.log(`❌ HTTPS failed: ${err.message}`);
  console.log("  → Your network might not have HTTPS access or requires a proxy\n");
  testOpenAI();
});

function testOpenAI() {
  console.log("\n2️⃣ Testing OpenAI endpoint...");
  
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/chat/completions',
    method: 'HEAD'
  };

  https.request(options, (res) => {
    console.log(`✅ OpenAI endpoint accessible (Status: ${res.statusCode})`);
    console.log("\n✨ Network diagnostics complete!");
  }).on('error', (err) => {
    console.log(`❌ OpenAI endpoint not accessible: ${err.message}`);
    console.log("\n💡 Possible solutions:");
    console.log("  1. Check if you're behind a corporate firewall");
    console.log("  2. Configure a proxy if needed");
    console.log("  3. Use a VPN if OpenAI is blocked in your region");
    console.log("  4. Try using a cloud environment (e.g., GitHub Codespaces)");
  }).end();
}
