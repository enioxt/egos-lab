# Prompt: Rule Forge (Marketplace)

**Context:**
A marketplace where users can browse, copy, and fork configuration rules (`.windsurfrules`, `.cursorrules`, `.guarani`).

**Visual Style:**
- **Theme:** "Extensions Store" clean layout (like VS Code Marketplace or Raycast Store).
- **Grid:** Responsive cards with clean borders.

**Key Elements:**

1.  **Sidebar Filters:**
    - **IDE:** Windsurf, Cursor, Cline, Antigravity.
    - **Stack:** Next.js, Python, Rust, Go.
    - **Goal:** Security, Speed, Refactoring, Docs.

2.  **Rule Cards (The Item):**
    - **Header:** Icon (IDE logo) + Title ("Next.js Hardened Rules").
    - **Author:** Avatar + @username (linked to GitHub).
    - **Stats:** ⭐ 4.8 | ⬇️ 1.2k installs.
    - **Tags:** `Security`, `TypeScript`, `Strict`.
    - **Action:** "Copy" button (instantly copies to clipboard).

3.  **Detail Modal (Quick View):**
    - Opens on click.
    - **Preview:** Syntax-highlighted code block showing the rule content.
    - **Explanation:** "Why use this?" text.
    - **Install Guide:** "Save this as .windsurfrules in your root."

4.  **Header Actions:**
    - Search bar ("Search for 'python data' rules...").
    - "Submit Rule" button (Primary).

**Interaction:**
- Filter click -> Grid shuffles (Layout animation).
- Copy button -> Toast "Copied to clipboard! Paste in .windsurfrules".

**Output Format:**
- React + Tailwind component (`RuleForge.tsx`).
- Use `lucide-react` for IDE icons.
