
import { Octokit } from "octokit";

// Initialize Octokit (GitHub API Client)
// We use a public token or no token for public repos to avoid rate limits if possible,
// but for better limits, a GITHUB_TOKEN is recommended.
const octokit = new Octokit({
    auth: import.meta.env.VITE_GITHUB_TOKEN
});

const OWNER = 'enioxt';
const REPO = 'egos-lab';

export interface CommitNode {
    id: string;
    message: string;
    author: string;
    date: string;
    url: string;
    group: number; // 1 = Main, 2 = Branch A, 3 = Branch B
    val: number;   // Size of node
}

export interface CommitLink {
    source: string;
    target: string;
}

export interface GraphData {
    nodes: CommitNode[];
    links: CommitLink[];
}

export async function fetchRepoGraph(): Promise<GraphData> {
    try {
        console.log(`🌀 Spiral: Fetching data for ${OWNER}/${REPO}...`);

        // 1. Fetch Main Branch Commits
        const { data: mainCommits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
            owner: OWNER,
            repo: REPO,
            per_page: 50,
            sha: 'main' // or master
        });

        // 2. Fetch Active Branches (Orbits)
        const { data: branches } = await octokit.request('GET /repos/{owner}/{repo}/branches', {
            owner: OWNER,
            repo: REPO,
            per_page: 5
        });

        const nodes: CommitNode[] = [];
        const links: CommitLink[] = [];
        const commitMap = new Set<string>();

        // Process Main Branch (Core)
        mainCommits.forEach((commit, index) => {
            if (commitMap.has(commit.sha)) return;

            nodes.push({
                id: commit.sha,
                message: commit.commit.message.split('\n')[0],
                author: commit.commit.author?.name || 'Unknown',
                date: commit.commit.author?.date || '',
                url: commit.html_url,
                group: 1, // Core
                val: 5 // Main commits are larger
            });
            commitMap.add(commit.sha);

            // Link to parent (if exists and is in our list)
            // Note: This is a simplified chain. Real git graph is DAG.
            // visualizer force-graph usually handles missing targets gracefully or we filter links.
            if (index > 0) {
                links.push({ source: mainCommits[index - 1].sha, target: commit.sha });
            }
        });

        // Process Other Branches (Orbits)
        for (const branch of branches) {
            if (branch.name === 'main' || branch.name === 'master') continue;

            const { data: branchCommits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
                owner: OWNER,
                repo: REPO,
                per_page: 10,
                sha: branch.name
            });

            branchCommits.forEach((commit, index) => {
                // If commit already exists (e.g. branched from main), just link it?
                // For visualization, we might want duplicate nodes to show "orbiting" effect of the branch
                // but for now let's reuse if same SHA to show convergence.

                if (!commitMap.has(commit.sha)) {
                    nodes.push({
                        id: commit.sha,
                        message: `[${branch.name}] ${commit.commit.message.split('\n')[0]}`,
                        author: commit.commit.author?.name || 'Unknown',
                        date: commit.commit.author?.date || '',
                        url: commit.html_url,
                        group: 2, // Orbit
                        val: 3
                    });
                    commitMap.add(commit.sha);
                }

                if (index > 0) {
                    links.push({ source: branchCommits[index - 1].sha, target: commit.sha });
                }
            });
        }

        return { nodes, links };

    } catch (error) {
        console.error("❌ Spiral: Error fetching GitHub data", error);
        // Fallback or empty
        return { nodes: [], links: [] };
    }
}
