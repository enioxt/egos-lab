import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * GET /api/contributions/leaderboard
 * 
 * Returns the framework contributor leaderboard.
 * Reads from .guarani/contributions.json
 */

interface Contribution {
  commit_hash: string;
  author: string;
  date: string;
  type: string;
  message: string;
  points: number;
  files_changed: number;
}

interface ContributorStats {
  author: string;
  total_points: number;
  commit_count: number;
  rank: string;
  breakdown: Record<string, number>;
}

// Rank thresholds (Fibonacci-based)
function getRank(points: number): string {
  if (points >= 987) return '🏆 Diamond Contributor';
  if (points >= 610) return '💎 Platinum Contributor';
  if (points >= 377) return '🥇 Gold Contributor';
  if (points >= 144) return '🥈 Silver Contributor';
  if (points >= 55) return '🥉 Bronze Contributor';
  if (points >= 21) return '⭐ Rising Contributor';
  return '🌱 New Contributor';
}

export async function GET(request: NextRequest) {
  try {
    const contributionsPath = path.resolve(process.cwd(), '../../.guarani/contributions.json');
    
    // Check if file exists
    if (!fs.existsSync(contributionsPath)) {
      return NextResponse.json({
        success: true,
        leaderboard: [],
        total_contributors: 0,
        total_points: 0,
        total_commits: 0,
        message: 'No contributions recorded yet'
      });
    }

    // Read contributions
    const data = fs.readFileSync(contributionsPath, 'utf-8');
    const contributions: Contribution[] = JSON.parse(data);

    // Group by author
    const authorMap = new Map<string, Contribution[]>();
    for (const c of contributions) {
      const existing = authorMap.get(c.author) || [];
      existing.push(c);
      authorMap.set(c.author, existing);
    }

    // Calculate stats for each author
    const leaderboard: ContributorStats[] = [];
    
    for (const [author, authorContributions] of authorMap) {
      const breakdown: Record<string, number> = {};
      let totalPoints = 0;

      for (const c of authorContributions) {
        breakdown[c.type] = (breakdown[c.type] || 0) + c.points;
        totalPoints += c.points;
      }

      leaderboard.push({
        author,
        total_points: totalPoints,
        commit_count: authorContributions.length,
        rank: getRank(totalPoints),
        breakdown,
      });
    }

    // Sort by points descending
    leaderboard.sort((a, b) => b.total_points - a.total_points);

    // Calculate totals
    const totalPoints = leaderboard.reduce((sum, c) => sum + c.total_points, 0);
    const totalCommits = leaderboard.reduce((sum, c) => sum + c.commit_count, 0);

    return NextResponse.json({
      success: true,
      leaderboard,
      total_contributors: leaderboard.length,
      total_points: totalPoints,
      total_commits: totalCommits,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contributions/leaderboard
 * 
 * Record a new contribution (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { commit_hash, author, message, files_changed } = await request.json();

    if (!commit_hash || !author || !message) {
      return NextResponse.json(
        { error: 'commit_hash, author, and message are required' },
        { status: 400 }
      );
    }

    const contributionsPath = path.resolve(process.cwd(), '../../.guarani/contributions.json');
    
    // Load existing contributions
    let contributions: Contribution[] = [];
    if (fs.existsSync(contributionsPath)) {
      const data = fs.readFileSync(contributionsPath, 'utf-8');
      contributions = JSON.parse(data);
    }

    // Check if already recorded
    if (contributions.some(c => c.commit_hash === commit_hash)) {
      return NextResponse.json({
        success: false,
        message: 'Contribution already recorded'
      });
    }

    // Parse commit type
    const typeMatch = message.match(/^(\w+)(?:\(.*?\))?:/);
    const type = typeMatch ? typeMatch[1].toLowerCase() : 'other';

    // Calculate points
    const POINT_VALUES: Record<string, number> = {
      feat: 8, feature: 8,
      fix: 5, bugfix: 5,
      docs: 3, doc: 3,
      test: 5, tests: 5,
      refactor: 3,
      chore: 1,
      perf: 8, performance: 8,
      security: 13, sec: 13,
      style: 1,
      ci: 2,
      build: 2,
    };

    const basePoints = POINT_VALUES[type] || 1;
    const filesCount = files_changed || 1;

    // File multipliers (Fibonacci thresholds)
    let multiplier = 1.0;
    if (filesCount >= 56) multiplier = 2.0;
    else if (filesCount >= 22) multiplier = 1.8;
    else if (filesCount >= 9) multiplier = 1.5;
    else if (filesCount >= 4) multiplier = 1.2;

    const points = Math.round(basePoints * multiplier);

    // Create new contribution
    const contribution: Contribution = {
      commit_hash,
      author,
      date: new Date().toISOString(),
      type,
      message: message.slice(0, 100),
      points,
      files_changed: filesCount,
    };

    contributions.push(contribution);

    // Ensure directory exists
    const dir = path.dirname(contributionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save
    fs.writeFileSync(contributionsPath, JSON.stringify(contributions, null, 2));

    return NextResponse.json({
      success: true,
      contribution,
      message: `+${points} points for ${author}`,
    });

  } catch (error) {
    console.error('[Leaderboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to record contribution' },
      { status: 500 }
    );
  }
}
