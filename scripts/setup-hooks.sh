#!/bin/bash
# Setup script for git hooks
# Run: bash scripts/setup-hooks.sh

set -e

HOOK_DIR=".git/hooks"
SRC_DIR="scripts/hooks"

echo "🔧 Installing git hooks..."

if [ ! -d "$HOOK_DIR" ]; then
  echo "❌ Not a git repository (no .git/hooks directory)"
  exit 1
fi

cp "$SRC_DIR/pre-commit" "$HOOK_DIR/pre-commit"
chmod +x "$HOOK_DIR/pre-commit"

echo "✅ pre-commit hook installed"
echo ""
echo "Your commits will now be scanned for secrets automatically."
echo "To skip (NOT recommended): git commit --no-verify"
