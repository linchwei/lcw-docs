#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost/api/auth/login -H 'Content-Type: application/json' -d '{"username":"testuser","password":"Test123456"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["access_token"])')
echo "Token: ${TOKEN:0:20}..."

echo "=== Test 1: Direct WebSocket to server (port 8082) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Upgrade: websocket" \
  -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  "http://localhost:8082/doc-yjs-pageLEh3Qe?token=$TOKEN"

echo "=== Test 2: WebSocket through Nginx (port 80) ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -H "Upgrade: websocket" \
  -H "Connection: Upgrade" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
  -H "Sec-WebSocket-Version: 13" \
  "http://localhost/doc-yjs-pageLEh3Qe?token=$TOKEN"

echo "=== Test 3: Check Nginx error log ==="
sudo docker logs lcw-docs-web --tail 10 2>&1

echo "=== Test 4: Check server logs for WS ==="
sudo docker logs lcw-docs-server --tail 10 2>&1
