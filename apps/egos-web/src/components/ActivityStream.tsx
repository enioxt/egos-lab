import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCommit, ExternalLink } from 'lucide-react';
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
};

async function fetchGitHubCommits(): Promise<CommitData[]> {
  try {
    const res = await fetch('https://api.github.com/repos/enioxt/egos-lab/commits?per_page=12', {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    });
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
          .select('sha, message, author, date, url, repo')
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

        {commits.map((commit, i) => (
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
              <div className="activity-dot" />
            </div>
            <div className="activity-content">
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
        ))}
      </div>
    </section>
  );
};

export default ActivityStream;
