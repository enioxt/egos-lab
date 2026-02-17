import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, GitCommit, Zap, MessageCircle, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../lib/supabase';

const RhoGauge: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.min(score * 100, 100);
  const color = percentage > 70 ? '#10b981' : percentage > 40 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rho-gauge">
      <svg width="140" height="140" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          transform="rotate(-90 50 50)"
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
        <text x="50" y="46" textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Space Grotesk, sans-serif">
          {(score * 100).toFixed(1)}
        </text>
        <text x="50" y="62" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Space Grotesk, sans-serif" letterSpacing="0.15em">
          RHO SCORE
        </text>
      </svg>
    </div>
  );
};

const CommitFeed: React.FC = () => {
  const { commits, isLoadingCommits, setCommits, setIsLoadingCommits } = useAppStore();

  useEffect(() => {
    const loadCommits = async () => {
      setIsLoadingCommits(true);
      const { data } = await supabase
        .from('commits')
        .select('id, sha, message, author, date, url, repo')
        .order('date', { ascending: false })
        .limit(20);

      if (data) {
        setCommits(data);
      }
      setIsLoadingCommits(false);
    };

    loadCommits();
  }, [setCommits, setIsLoadingCommits]);

  if (isLoadingCommits) {
    return (
      <div className="commit-feed-loading">
        <div className="pulse-dot" />
        <span>Carregando commits...</span>
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="commit-feed-empty">
        <GitCommit size={24} opacity={0.3} />
        <p>Nenhum commit carregado.</p>
        <code>bun apps/egos-web/scripts/ingest-commits.ts</code>
      </div>
    );
  }

  return (
    <div className="commit-feed">
      {commits.slice(0, 8).map((commit, i) => (
        <motion.a
          key={commit.sha}
          href={commit.url}
          target="_blank"
          rel="noopener noreferrer"
          className="commit-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="commit-dot" />
          <div className="commit-content">
            <p className="commit-message">{commit.message}</p>
            <div className="commit-meta">
              <span className="commit-author">{commit.author}</span>
              <span className="commit-date">
                {new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
              <span className="commit-repo">{commit.repo?.split('/')[1]}</span>
            </div>
          </div>
          <ExternalLink size={12} className="commit-link-icon" />
        </motion.a>
      ))}
    </div>
  );
};

const KpiCards: React.FC = () => {
  const { commits, rhoScore } = useAppStore();

  const uniqueAuthors = new Set(commits.map((c) => c.author)).size;
  const uniqueRepos = new Set(commits.map((c) => c.repo)).size;

  return (
    <div className="kpi-grid">
      <div className="kpi-card">
        <GitCommit size={16} className="kpi-icon" />
        <span className="kpi-value">{commits.length}</span>
        <span className="kpi-label">Commits</span>
      </div>
      <div className="kpi-card">
        <Activity size={16} className="kpi-icon" />
        <span className="kpi-value">{uniqueAuthors}</span>
        <span className="kpi-label">Authors</span>
      </div>
      <div className="kpi-card">
        <Zap size={16} className="kpi-icon" />
        <span className="kpi-value">{uniqueRepos}</span>
        <span className="kpi-label">Repos</span>
      </div>
      <div className="kpi-card">
        <MessageCircle size={16} className="kpi-icon" />
        <span className="kpi-value">{(rhoScore * 100).toFixed(0)}%</span>
        <span className="kpi-label">Health</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const { rhoScore, toggleChat } = useAppStore();

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Mission Control</h2>
          <p className="dashboard-subtitle">EGOS Lab Intelligence</p>
        </div>
        <RhoGauge score={rhoScore} />
      </div>

      {/* KPIs */}
      <KpiCards />

      {/* Commit Feed */}
      <div className="dashboard-section">
        <div className="section-header">
          <span className="section-dot" />
          <h3>Recent Activity</h3>
        </div>
        <CommitFeed />
      </div>

      {/* Chat CTA */}
      <button className="chat-cta" onClick={toggleChat}>
        <MessageCircle size={18} />
        <span>Pergunte ao EGOS Intelligence</span>
      </button>
    </motion.div>
  );
};

export default Dashboard;
