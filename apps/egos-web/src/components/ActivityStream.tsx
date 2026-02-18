import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit, Sparkles, Bug, FileText, Shield, Wrench,
  Zap, TestTube, Settings, AlertTriangle, X, Copy, Check, Filter,
  ArrowUpRight, Clock, User, Tag
} from 'lucide-react';
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

function getRelativeTime(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function generateInsight(commit: CommitData): string {
  const cat = commit.category || getCategoryFromMessage(commit.message);
  const msg = commit.message.toLowerCase();
  if (cat === 'security') return 'Mudança de segurança — verifique se RLS policies e headers estão corretos.';
  if (cat === 'fix') return 'Bug fix aplicado. Considere adicionar teste de regressão para prevenir recorrência.';
  if (cat === 'feat') return 'Nova feature adicionada. Verifique se a documentação e TASKS.md foram atualizados.';
  if (cat === 'refactor') return 'Refatoração — melhoria de arquitetura sem mudança de comportamento. Bom para manutenibilidade.';
  if (cat === 'docs') return 'Documentação atualizada. Mantenha SSOT — evite docs duplicados.';
  if (cat === 'perf') return 'Otimização de performance. Considere adicionar benchmark antes/depois.';
  if (msg.includes('deploy') || msg.includes('vercel')) return 'Mudança de deploy/infraestrutura. Monitore o build no Vercel.';
  if (msg.includes('agent')) return 'Mudança no sistema de agentes. Execute bun agent:all para validar.';
  if (commit.techDebt) return '⚠️ Tech debt detectado. Priorize resolução para evitar acúmulo.';
  return 'Commit padrão. Verifique se segue conventional commits (feat:/fix:/chore:).';
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

/* ── Commit Detail Modal ── */
const CommitModal: React.FC<{ commit: CommitData; onClose: () => void }> = ({ commit, onClose }) => {
  const [copied, setCopied] = useState(false);
  const cat = commit.category || getCategoryFromMessage(commit.message);
  const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.chore;
  const Icon = config.icon;
  const insight = generateInsight(commit);

  const copySha = useCallback(() => {
    navigator.clipboard.writeText(commit.sha).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [commit.sha]);

  return (
    <motion.div
      className="commit-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', maxWidth: '520px', width: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: `${config.color}15`, border: `1px solid ${config.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: config.color,
            }}>
              <Icon size={18} />
            </div>
            <div>
              <span style={{
                fontSize: '11px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: config.color,
              }}>
                {config.label}
              </span>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                {getRelativeTime(commit.date)}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 500, lineHeight: 1.5, marginBottom: '16px' }}>
            {commit.message}
          </p>

          {/* Metadata */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <User size={12} /> {commit.author}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <Clock size={12} /> {new Date(commit.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              <GitCommit size={12} /> {commit.repo?.split('/')[1]}
            </div>
          </div>

          {/* Tags */}
          {commit.tags && commit.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {commit.tags.map((tag: string) => (
                <span key={tag} style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <Tag size={8} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Tech Debt Badge */}
          {commit.techDebt && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
              borderRadius: '8px', background: '#f59e0b10', border: '1px solid #f59e0b25',
              marginBottom: '16px', fontSize: '12px', color: '#f59e0b',
            }}>
              <AlertTriangle size={14} />
              Tech debt detectado neste commit
            </div>
          )}

          {/* AI Insight */}
          <div style={{
            padding: '12px 14px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(19,182,236,0.06), rgba(168,85,247,0.06))',
            border: '1px solid rgba(19,182,236,0.12)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px',
              fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.06em', color: '#13b6ec',
            }}>
              <Sparkles size={10} /> Insight
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
              {insight}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: '12px 20px 16px', display: 'flex', gap: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <button onClick={copySha} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '8px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} />}
            {copied ? 'Copiado!' : `SHA: ${commit.sha.slice(0, 7)}`}
          </button>
          <a href={commit.url} target="_blank" rel="noopener noreferrer" style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '6px', padding: '8px', borderRadius: '8px', fontSize: '12px',
            fontWeight: 500, border: 'none', textDecoration: 'none',
            background: 'rgba(19,182,236,0.12)', color: '#13b6ec',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowUpRight size={14} /> Ver no GitHub
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Filter Bar ── */
const FilterBar: React.FC<{
  activeFilter: string | null;
  onFilter: (cat: string | null) => void;
  counts: Record<string, number>;
}> = ({ activeFilter, onFilter, counts }) => (
  <div style={{
    display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px',
    padding: '0 4px',
  }}>
    <button
      onClick={() => onFilter(null)}
      style={{
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
        fontWeight: 500, border: '1px solid',
        borderColor: !activeFilter ? 'rgba(19,182,236,0.4)' : 'rgba(255,255,255,0.08)',
        background: !activeFilter ? 'rgba(19,182,236,0.1)' : 'transparent',
        color: !activeFilter ? '#13b6ec' : 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <Filter size={10} /> Todos
    </button>
    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
      const count = counts[key] || 0;
      if (count === 0) return null;
      const isActive = activeFilter === key;
      const CatIcon = cfg.icon;
      return (
        <button
          key={key}
          onClick={() => onFilter(isActive ? null : key)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px',
            fontWeight: 500, border: '1px solid',
            borderColor: isActive ? `${cfg.color}60` : 'rgba(255,255,255,0.08)',
            background: isActive ? `${cfg.color}15` : 'transparent',
            color: isActive ? cfg.color : 'rgba(255,255,255,0.4)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <CatIcon size={10} /> {cfg.label}
          <span style={{ opacity: 0.6 }}>({count})</span>
        </button>
      );
    })}
  </div>
);

/* ── Main Component ── */
const ActivityStream: React.FC = () => {
  const { commits, isLoadingCommits, setCommits, setIsLoadingCommits } = useAppStore();
  const [selectedCommit, setSelectedCommit] = useState<CommitData | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoadingCommits(true);
      try {
        const { data, error } = await supabase
          .from('commits')
          .select('sha, message, author, date, url, repo, category, tags, tech_debt_flag, impact_score')
          .order('date', { ascending: false })
          .limit(20);

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

  const categoryCounts: Record<string, number> = {};
  commits.forEach((c) => {
    const cat = c.category || getCategoryFromMessage(c.message);
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const filteredCommits = activeFilter
    ? commits.filter((c) => (c.category || getCategoryFromMessage(c.message)) === activeFilter)
    : commits;

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
          Clique em qualquer commit para ver detalhes, insights e ações.
        </p>
      </motion.div>

      <FilterBar activeFilter={activeFilter} onFilter={setActiveFilter} counts={categoryCounts} />

      <div className="activity-timeline">
        {isLoadingCommits && (
          <div className="activity-loading">
            <div className="pulse-dot" />
            <span>Carregando atividade...</span>
          </div>
        )}

        {!isLoadingCommits && filteredCommits.length === 0 && (
          <div className="activity-empty">
            <GitCommit size={24} opacity={0.3} />
            <p>{activeFilter ? `Nenhum commit do tipo "${activeFilter}".` : 'Nenhuma atividade registrada ainda.'}</p>
          </div>
        )}

        {filteredCommits.map((commit, i) => {
          const cat = commit.category || getCategoryFromMessage(commit.message);
          const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.chore;
          const Icon = config.icon;
          const techDebt = commit.techDebt || false;

          return (
            <motion.div
              key={commit.sha}
              className="activity-item"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelectedCommit(commit)}
              style={{ cursor: 'pointer' }}
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
                  <span style={{ marginLeft: 'auto', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                    {getRelativeTime(commit.date)}
                  </span>
                </div>
                <p className="activity-message">{commit.message}</p>
                <div className="activity-meta">
                  <span>{commit.author}</span>
                  <span>·</span>
                  <span className="activity-repo">{commit.repo?.split('/')[1]}</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedCommit && (
          <CommitModal commit={selectedCommit} onClose={() => setSelectedCommit(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

export default ActivityStream;
