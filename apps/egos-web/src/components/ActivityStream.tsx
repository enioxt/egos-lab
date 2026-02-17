import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, ExternalLink, Sparkles, Bug, FileText, Shield, Wrench, Zap, TestTube, Settings, AlertTriangle } from 'lucide-react';
import { useAppStore, type CommitData } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

type GitHubCommitResponseItem = {
  sha: string;
  html_url?: string;
  commit?: {
    message?: string;
    author?: {
      name?: string;
      date?: string;
    };
  };
  author?: {
    login?: string;
  };
};

type SupabaseCommitRow = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo: string;
  category: string | null;
  tags: string[] | null;
  tech_debt_flag: boolean | null;
  impact_score: number | null;
};

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  feat: { icon: Sparkles, color: '#22c55e', label: 'Feature' },
  fix: { icon: Bug, color: '#ef4444', label: 'Fix' },
  docs: { icon: FileText, color: '#3b82f6', label: 'Docs' },
  security: { icon: Shield, color: '#f59e0b', label: 'Security' },
  refactor: { icon: Wrench, color: '#8b5cf6', label: 'Refactor' },
  perf: { icon: Zap, color: '#06b6d4', label: 'Perf' },
  test: { icon: TestTube, color: '#ec4899', label: 'Test' },
  chore: { icon: Settings, color: '#64748b', label: 'Chore' },
  infra: { icon: Settings, color: '#f97316', label: 'Infra' },
};

function getCategoryFromMessage(message: string): string {
  const prefix = message.split(':')[0]?.split('(')[0]?.trim().toLowerCase();
  if (prefix && CATEGORY_CONFIG[prefix]) return prefix;
  if (message.toLowerCase().includes('fix')) return 'fix';
  if (message.toLowerCase().includes('doc')) return 'docs';
  return 'chore';
}

async function fetchGitHubCommits(): Promise<CommitData[]> {
  try {
    const res = await fetch('/api/github-commits');
    if (!res.ok) return [];
    const data = (await res.json()) as GitHubCommitResponseItem[];
    return data
      .filter((c) => typeof c?.sha === 'string')
      .map((c) => ({
        id: c.sha,
        sha: c.sha,
        message: (c.commit?.message || 'commit').split('\n')[0],
        author: c.commit?.author?.name || c.author?.login || 'Unknown',
        date: c.commit?.author?.date || new Date().toISOString(),
        url: c.html_url || `https://github.com/enioxt/egos-lab/commit/${c.sha}`,
        repo: 'enioxt/egos-lab',
      }));
  } catch {
    return [];
  }
}

const ActivityStream: React.FC = () => {
  const { commits, isLoadingCommits, setCommits, setIsLoadingCommits } = useAppStore();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingCommits(true);
      try {
        const { data, error } = await supabase
          .from('commits')
          .select('sha, message, author, date, url, repo, category, tags, tech_debt_flag, impact_score')
          .order('date', { ascending: false })
          .limit(12);

        if (!cancelled && !error && data && data.length > 0) {
          const rows = data as SupabaseCommitRow[];
          setCommits(
            rows.map((c) => ({
              id: c.sha,
              sha: c.sha,
              message: c.message,
              author: c.author,
              date: c.date,
              url: c.url,
              repo: c.repo,
              category: c.category || getCategoryFromMessage(c.message),
              tags: c.tags || [],
              techDebt: c.tech_debt_flag || false,
              impactScore: c.impact_score || 5,
            }))
          );
          setIsLoadingCommits(false);
          return;
        }
      } catch {
        // fall through to GitHub
      }

      const gh = await fetchGitHubCommits();
      if (!cancelled) setCommits(gh);
      setIsLoadingCommits(false);
    };

    load();
    const interval = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [setCommits, setIsLoadingCommits]);

  return (
    <section id="activity" className="activity">
      <motion.div
        className="section-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Atividade Recente</h2>
        <p className="section-desc">
          Últimos commits do ecossistema — direto do Git.
        </p>
      </motion.div>

      <div className="activity-timeline">
        {isLoadingCommits && (
          <div className="activity-loading">
            <div className="pulse-dot" />
            <span>Carregando atividade...</span>
          </div>
        )}

        {!isLoadingCommits && commits.length === 0 && (
          <div className="activity-empty">
            <GitCommit size={24} opacity={0.3} />
            <p>Nenhuma atividade registrada ainda.</p>
          </div>
        )}

        {commits.map((commit, i) => {
          const cat = commit.category || getCategoryFromMessage(commit.message);
          const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.chore;
          const Icon = config.icon;
          const techDebt = commit.techDebt || false;

          return (
            <motion.a
              key={commit.sha}
              href={commit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="activity-item"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
            >
              <div className="activity-line">
                <div className="activity-dot" style={{ borderColor: config.color }} />
              </div>
              <div className="activity-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: config.color,
                      background: `${config.color}15`,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    <Icon size={10} />
                    {config.label}
                  </span>
                  {techDebt && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '9px',
                        color: '#f59e0b',
                        background: '#f59e0b15',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        border: '1px solid #f59e0b30',
                      }}
                    >
                      <AlertTriangle size={9} />
                      debt
                    </span>
                  )}
                </div>
                <p className="activity-message">{commit.message}</p>
                <div className="activity-meta">
                  <span>{commit.author}</span>
                  <span>·</span>
                  <span>{new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  <span className="activity-repo">{commit.repo?.split('/')[1]}</span>
                  <ExternalLink size={10} className="activity-ext" />
                </div>
              </div>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
};

export default ActivityStream;
