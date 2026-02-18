import { readdir, stat, readFile, writeFile } from 'fs/promises';
import { join, relative } from 'path';

const ROOT_DIR = process.cwd();
const OUTPUT_FILE = join(ROOT_DIR, 'docs', 'SYSTEM_MAP.md');

// Configuration
const IGNORE_DIRS = ['.git', 'node_modules', '.next', 'dist', 'build', '.contentlayer', '.turbo', '.vercel'];
const APP_DIRS = ['apps', 'packages', 'agents', 'scripts'];

interface FileStats {
  files: number;
  lines: number;
  size: number;
  types: Record<string, number>;
}

interface DirNode {
  name: string;
  path: string;
  type: 'dir' | 'file';
  stats?: FileStats;
  children?: DirNode[];
  description?: string;
}

async function countLines(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

async function scanDirectory(dirPath: string, depth = 0): Promise<DirNode> {
  const name = relative(ROOT_DIR, dirPath) || '.';
  const stats: FileStats = { files: 0, lines: 0, size: 0, types: {} };
  const children: DirNode[] = [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) continue;

      const fullPath = join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const childNode = await scanDirectory(fullPath, depth + 1);
        children.push(childNode);
        
        // Aggregate stats
        stats.files += childNode.stats?.files || 0;
        stats.lines += childNode.stats?.lines || 0;
        stats.size += childNode.stats?.size || 0;
        for (const [ext, count] of Object.entries(childNode.stats?.types || {})) {
          stats.types[ext] = (stats.types[ext] || 0) + count;
        }
      } else {
        const ext = entry.name.split('.').pop() || 'no-ext';
        const fileStat = await stat(fullPath);
        const lines = await countLines(fullPath);
        
        stats.files++;
        stats.lines += lines;
        stats.size += fileStat.size;
        stats.types[ext] = (stats.types[ext] || 0) + 1;
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dirPath}:`, error);
  }

  return { name, path: dirPath, type: 'dir', stats, children };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateMarkdown(rootNode: DirNode): string {
  const date = new Date().toISOString().split('T')[0];
  
  let md = `# EGOS Lab System Map
> **Generated:** ${date}
> **Scope:** \`apps/\`, \`packages/\`, \`agents/\`, \`scripts/\`
> **Purpose:** Single Source of Truth for Humans and AIs to understand the repo structure.

## 📊 High Level Stats

| Metric | Value |
|--------|-------|
| **Total Files** | ${rootNode.stats?.files} |
| **Total Lines of Code** | ${rootNode.stats?.lines.toLocaleString()} |
| **Total Size** | ${formatBytes(rootNode.stats?.size || 0)} |

### File Types
${Object.entries(rootNode.stats?.types || {})
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([ext, count]) => `- **.${ext}**: ${count}`)
  .join('\n')}

---

## 🗺️ Module Map

`;

  // Process top-level directories
  for (const child of rootNode.children || []) {
    // Only show relevant top-level dirs
    if (!APP_DIRS.some(d => child.path.includes(d))) {
       // Keep docs separate or include? The prompt asked for "apps, packages, agents" mostly but let's see.
       // Actually let's include everything in the root that isn't hidden
    }
    
    md += `### 📂 ${child.name.split('/').pop()}
**Files:** ${child.stats?.files} | **LOC:** ${child.stats?.lines.toLocaleString()}

`;

    // 2nd level
    if (child.children) {
      md += `| Module | Files | LOC | Description |\n|---|---|---|---|\n`;
      for (const sub of child.children.sort((a, b) => (b.stats?.lines || 0) - (a.stats?.lines || 0))) {
        const subName = sub.name.split('/').pop() || '';
        md += `| \`${subName}\` | ${sub.stats?.files} | ${sub.stats?.lines.toLocaleString()} | - |\n`;
      }
      md += '\n';
    }
  }

  return md;
}

async function main() {
  console.log('🔍 Scanning repository...');
  const rootNode = await scanDirectory(ROOT_DIR);
  
  // Filter root children to only show relevant ones in the detailed map
  const relevantChildren = rootNode.children?.filter(c => {
    const name = c.name.split('/').pop();
    return ['apps', 'packages', 'agents', 'scripts', 'docs', 'projects'].includes(name || '');
  });
  
  if (relevantChildren) {
    rootNode.children = relevantChildren;
  }

  console.log('📝 Generating System Map...');
  const markdown = generateMarkdown(rootNode);
  
  await writeFile(OUTPUT_FILE, markdown);
  console.log(`✅ System Map generated at: ${OUTPUT_FILE}`);
}

main().catch(console.error);
