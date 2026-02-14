#!/bin/bash

# BioTender GLM API Curl Test
# 用法: ./test-glm-curl.sh YOUR_API_KEY

API_KEY="${1:-your-api-key}"
ENDPOINT="https://open.bigmodel.cn/api/paas/v4/chat/completions"

echo "🧪 Testing GLM API with cURL..."
echo "API Key: ${API_KEY:0:10}...${API_KEY: -10}"
echo "Endpoint: $ENDPOINT"
echo ""

curl -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "model": "glm-5",
    "messages": [
      {
        "role": "user",
        "content": "用一句话解释什么是AlphaFold"
      }
    ],
    "thinking": {
      "type": "enabled"
    },
    "max_tokens": 4096,
    "temperature": 1.0
  }' \
  -w "\n\nHTTP Status: %{http_code}\n"
