#!/bin/bash
# Verify that notion CLI is properly installed and accessible

set -e

echo "🔍 Verifying Notion CLI installation..."

# Check if opencli is installed
if ! command -v opencli &> /dev/null; then
  echo "❌ opencli not found. Please install opencli first."
  exit 1
fi

echo "✅ opencli found"

# Check if notion commands are registered
echo "🔍 Checking notion command registration..."

if opencli notion --help &>/dev/null; then
  echo "✅ Notion commands are registered in opencli"
else
  echo "⚠️  Notion commands may not be registered"
  echo "   Run 'opencli notion --help' to verify"
fi

# Check CDP endpoint availability
echo "🔍 Checking CDP endpoint availability..."

FOUND_PORT=""
if lsof -i :9230 &>/dev/null 2>&1; then
  FOUND_PORT="9230"
  echo "✅ Port 9230 (primary) is available"
elif lsof -i :9222 &>/dev/null 2>&1; then
  FOUND_PORT="9222"
  echo "✅ Port 9222 (fallback) is available"
else
  echo "⚠️  Neither port 9230 nor 9222 appears to be listening"
  echo "   Make sure Notion is started with: /Applications/Notion.app/Contents/MacOS/Notion --remote-debugging-port=9230"
fi

# Try to get notion status (non-critical)
echo "🔍 Testing notion status command..."
if opencli notion status 2>/dev/null; then
  echo "✅ notion status command works"
  if [ -n "$FOUND_PORT" ]; then
    echo "   Using port: $FOUND_PORT"
  fi
else
  echo "⚠️  notion status failed - Notion may not be accessible"
  echo "   Verify OPENCLI_CDP_ENDPOINT is set correctly:"
  echo "   export OPENCLI_CDP_ENDPOINT=\"http://127.0.0.1:9230\"  (primary)"
  echo "   or"
  echo "   export OPENCLI_CDP_ENDPOINT=\"http://127.0.0.1:9222\"  (fallback)"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "Available Notion commands:"
opencli notion --help 2>/dev/null || echo "   (Run 'opencli notion <command> --help' for more info)"
