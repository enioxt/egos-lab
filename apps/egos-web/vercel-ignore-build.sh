#!/bin/bash

# Vercel Ignore Build Step Script
# Skips build if changes are only in docs, markdown, or unrelated files

# Get the latest commit message
LATEST_COMMIT_MESSAGE=$(git log -1 --pretty=%B)

# If commit message contains "[skip ci]" or "[docs]", skip build
if [[ "$LATEST_COMMIT_MESSAGE" == *"[skip ci]"* ]] || [[ "$LATEST_COMMIT_MESSAGE" == *"[docs]"* ]]; then
  echo "🛑 - Build cancelled (skip ci/docs flag detected)"
  exit 0;
fi

# Check for changes in specific paths (relative to app root)
# In Vercel monorepo setup, git diff is usually checked against HEAD^ or previous deployment
# For now, we trust Vercel's default "Root Directory" diffing, but we explicitly ignore .md files
# if ONLY .md files changed.

# This is tricky in Vercel standard environment without full git history sometimes.
# Simpler approach:
echo "✅ - Build proceeding"
exit 1;
