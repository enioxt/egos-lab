#!/bin/bash
# ╔═══════════════════════════════════════════════════════════╗
# ║  EGOS Knowledge Index Condenser (RAG Prep)                ║
# ║  Condenses all _knowledge/*.md files into one Index Map   ║
# ╚═══════════════════════════════════════════════════════════╝

DOCS_DIR="docs/_knowledge"
INDEX_FILE="$DOCS_DIR/KNOWLEDGE_INDEX.md"

echo "# 🧠 EGOS Knowledge Index (SSOT Cache)" > "$INDEX_FILE"
echo "> **Generated:** $(date -u +'%Y-%m-%dT%H:%M:%SZ')" >> "$INDEX_FILE"
echo "> **Purpose:** Master index of all architectural decisions. Agents must read this file FIRST to decide which specific knowledge files to load, preventing context window collapse." >> "$INDEX_FILE"
echo "" >> "$INDEX_FILE"

# Find all md files except the index itself
FILES=$(find "$DOCS_DIR" -type f -name "*.md" ! -name "KNOWLEDGE_INDEX.md" | sort -r)

if [ -z "$FILES" ]; then
    echo "*No knowledge dissemination files found.*" >> "$INDEX_FILE"
    echo "✅ Knowledge Index regenerated (Empty)."
    exit 0
fi

echo "## Document Registry" >> "$INDEX_FILE"

for filepath in $FILES; do
    filename=$(basename "$filepath")
    
    # Try to extract the first H1 header, otherwise use filename
    title=$(head -n 5 "$filepath" | grep -m 1 "^# " | sed 's/^# //')
    if [ -z "$title" ]; then
        title=$filename
    fi

    # Try to extract Metadata Tags or Status if they exist using awk
    tags=$(grep -i "tags:" "$filepath" | sed -E 's/.*tags:[ ]*(.*)/\1/I' | head -n 1)
    
    echo "- **[$title]($filename)**" >> "$INDEX_FILE"
    if [ -n "$tags" ]; then
        echo "  - *Tags:* $tags" >> "$INDEX_FILE"
    fi
done

echo "" >> "$INDEX_FILE"
echo "---" >> "$INDEX_FILE"
echo "*Agent Instruction: Use the links above to load ONLY the specific documentation required for your current task. DO NOT load the entire directory.*" >> "$INDEX_FILE"

echo "✅ Knowledge Index regenerated successfully at $INDEX_FILE."
