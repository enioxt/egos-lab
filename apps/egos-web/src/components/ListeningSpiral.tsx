import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit, Sparkles, Bug, FileText, Wrench, Zap,
  Users, ArrowUpRight, Clock, MessageCircle,
  ChevronDown, ExternalLink, Github, GitBranch,
  Plus, Minus, FolderTree, BarChart3, Info, Code2
} from 'lucide-react';
import { useAppStore, type CommitData } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';

/* ── Types ── */
type CommitCategory = 'feat' | 'fix' | 'docs' | 'refactor' | 'chore' | 'other';

/* ── Helpers ── */
function categorize(msg: string): CommitCategory {
  const lower = msg.toLowerCase();
  if (lower.startsWith('feat')) return 'feat';
  if (lower.startsWith('fix')) return 'fix';
  if (lower.startsWith('docs')) return 'docs';
  if (lower.startsWith('refactor')) return 'refactor';
  if (lower.startsWith('chore') || lower.startsWith('ci') || lower.startsWith('build')) return 'chore';
  return 'other';
}

function extractModule(msg: string): string {
  const match = msg.match(/^[a-z]+\(([^)]+)\)/);
  if (match) return match[1];
  return 'other';
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

function getAreaFromFile(filename: string): string {
  if (filename.startsWith('apps/egos-web/src/components/')) return 'components';
  if (filename.startsWith('apps/egos-web/src/pages/')) return 'pages';
  if (filename.startsWith('apps/egos-web/api/')) return 'api';
  if (filename.startsWith('apps/egos-web/src/')) return 'egos-web';
  if (filename.startsWith('agents/')) return 'agents';
  if (filename.startsWith('packages/')) return 'packages';
  if (filename.startsWith('docs/')) return 'docs';
  if (filename.startsWith('apps/intelink/')) return 'intelink';
  if (filename.startsWith('apps/nexus/')) return 'nexus';
  if (filename.startsWith('apps/eagle-eye/')) return 'eagle-eye';
  if (filename.includes('.css')) return 'styles';
  return 'root';
}

const categoryConfig: Record<CommitCategory, { icon: React.ElementType; color: string; label: string }> = {
  feat:     { icon: Sparkles, color: '#22c55e', label: 'Feature' },
  fix:      { icon: Bug, color: '#f59e0b', label: 'Fix' },
  docs:     { icon: FileText, color: '#a78bfa', label: 'Docs' },
  refactor: { icon: Wrench, color: '#6ee7b7', label: 'Refactor' },
  chore:    { icon: Zap, color: '#94a3b8', label: 'Chore' },
  other:    { icon: GitCommit, color: '#64748b', label: 'Commit' },
};

const areaColors: Record<string, string> = {
  components: '#22c55e', pages: '#3b82f6', api: '#f59e0b', 'egos-web': '#13b6ec',
  agents: '#8b5cf6', packages: '#ec4899', docs: '#a78bfa', intelink: '#06b6d4',
  nexus: '#f97316', 'eagle-eye': '#10b981', styles: '#e879f9', root: '#64748b',
};

/* ── Sub-Components ── */

const DiffBar: React.FC<{ additions: number; deletions: number }> = ({ additions, deletions }) => {
  const total = additions + deletions;
  if (total === 0) return null;
  const addPct = Math.round((additions / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
      <span style={{ color: '#22c55e', fontWeight: 600, fontFamily: 'monospace' }}>+{additions}</span>
      <span style={{ color: '#ef4444', fontWeight: 600, fontFamily: 'monospace' }}>-{deletions}</span>
      <div style={{
        width: 60, height: 6, borderRadius: 3, overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)', display: 'flex',
      }}>
        <div style={{ width: `${addPct}%`, background: '#22c55e', borderRadius: '3px 0 0 3px' }} />
        <div style={{ width: `${100 - addPct}%`, background: '#ef4444', borderRadius: '0 3px 3px 0' }} />
      </div>
    </div>
  );
};

const ActivityMiniChart: React.FC<{ commits: CommitData[] }> = ({ commits }) => {
  const days = useMemo(() => {
    const dayMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    commits.forEach(c => {
      const day = c.date.slice(0, 10);
      if (dayMap[day] !== undefined) dayMap[day]++;
    });
    return Object.entries(dayMap);
  }, [commits]);

  const maxCount = Math.max(...days.map(d => d[1]), 1);

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 4, height: 48,
      padding: '8px 0',
    }}>
      {days.map(([day, count]) => (
        <div key={day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
          <div style={{
            width: '100%', maxWidth: 32, borderRadius: 4,
            height: Math.max(4, (count / maxCount) * 36),
            background: count > 0 ? `rgba(19, 182, 236, ${0.3 + (count / maxCount) * 0.7})` : 'rgba(255,255,255,0.04)',
            transition: 'height 0.3s',
          }} />
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
            {new Date(day).toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
};

const ModuleBreakdown: React.FC<{ commits: CommitData[] }> = ({ commits }) => {
  const modules = useMemo(() => {
    const map: Record<string, { commits: number; additions: number; deletions: number }> = {};
    commits.forEach(c => {
      const mod = extractModule(c.message);
      if (!map[mod]) map[mod] = { commits: 0, additions: 0, deletions: 0 };
      map[mod].commits++;
      if (c.stats) {
        map[mod].additions += c.stats.additions;
        map[mod].deletions += c.stats.deletions;
      }
    });
    return Object.entries(map).sort((a, b) => b[1].commits - a[1].commits).slice(0, 8);
  }, [commits]);

  const maxCommits = Math.max(...modules.map(m => m[1].commits), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {modules.map(([name, data]) => (
        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, color: 'rgba(255,255,255,0.6)', width: 80,
            fontFamily: 'monospace', textAlign: 'right', flexShrink: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{name}</span>
          <div style={{
            flex: 1, height: 16, borderRadius: 4, overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)', position: 'relative',
          }}>
            <div style={{
              width: `${(data.commits / maxCommits) * 100}%`, height: '100%',
              background: `linear-gradient(90deg, rgba(19,182,236,0.3), rgba(19,182,236,0.15))`,
              borderRadius: 4, minWidth: 8,
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 24, textAlign: 'right' }}>
            {data.commits}
          </span>
          {(data.additions > 0 || data.deletions > 0) && (
            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', width: 60, textAlign: 'right' }}>
              <span style={{ color: '#22c55e' }}>+{data.additions}</span>{' '}
              <span style={{ color: '#ef4444' }}>-{data.deletions}</span>
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

/* ── Main Component ── */
const ListeningSpiral: React.FC = () => {
  const { commits } = useAppStore();
  const { isAuthenticated, avatarUrl, username, signInWithGitHub } = useAuth();
  const [showCount, setShowCount] = useState(15);
  const [activeCategory, setActiveCategory] = useState<CommitCategory | null>(null);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);

  const messages = useMemo(() =>
    [...commits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(commit => ({
        commit,
        category: categorize(commit.message),
        module: extractModule(commit.message),
      })),
    [commits]
  );

  const filtered = useMemo(() => {
    let result = messages;
    if (activeCategory) result = result.filter(m => m.category === activeCategory);
    if (activeAuthor) result = result.filter(m => m.commit.author === activeAuthor);
    return result;
  }, [messages, activeCategory, activeAuthor]);

  const visible = filtered.slice(0, showCount);

  const authors = useMemo(() => {
    const map: Record<string, { count: number; avatar?: string }> = {};
    messages.forEach(m => {
      if (!map[m.commit.author]) map[m.commit.author] = { count: 0, avatar: m.commit.author_avatar };
      map[m.commit.author].count++;
    });
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [messages]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    messages.forEach(m => { counts[m.category] = (counts[m.category] || 0) + 1; });
    return counts;
  }, [messages]);

  const totalStats = useMemo(() => {
    let additions = 0, deletions = 0, filesChanged = 0;
    commits.forEach(c => {
      if (c.stats) { additions += c.stats.additions; deletions += c.stats.deletions; }
      if (c.files) filesChanged += c.files.length;
    });
    return { additions, deletions, filesChanged };
  }, [commits]);

  return (
    <section id="spiral" className="spiral-section">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: 32 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 20,
          background: 'rgba(19,182,236,0.08)', border: '1px solid rgba(19,182,236,0.15)',
          marginBottom: 16,
        }}>
          <MessageCircle size={14} style={{ color: '#13b6ec' }} />
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#13b6ec', textTransform: 'uppercase' }}>
            Espiral de Escuta
          </span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif' }}>
          Contribuições em Tempo Real
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Cada commit, PR e issue é parte de uma conversa coletiva. Aqui você vê <strong style={{ color: 'rgba(255,255,255,0.8)' }}>quem</strong> está contribuindo,{' '}
          <strong style={{ color: 'rgba(255,255,255,0.8)' }}>o que</strong> mudou e{' '}
          <strong style={{ color: 'rgba(255,255,255,0.8)' }}>onde</strong> o impacto acontece.
        </p>
        <button
          onClick={() => setShowHowTo(!showHowTo)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            marginTop: 12, padding: '6px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <Info size={12} /> {showHowTo ? 'Fechar' : 'Como participar?'}
        </button>
      </motion.div>

      {/* How to Participate */}
      <AnimatePresence>
        {showHowTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              padding: 20, borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(19,182,236,0.06), rgba(139,92,246,0.06))',
              border: '1px solid rgba(19,182,236,0.12)',
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16,
            }}>
              {[
                { icon: GitBranch, title: '1. Fork o Repositório', desc: 'Crie sua cópia do código no GitHub para trabalhar livremente.' },
                { icon: Code2, title: '2. Faça Mudanças', desc: 'Implemente features, corrija bugs ou melhore docs na sua IDE.' },
                { icon: ArrowUpRight, title: '3. Abra um PR', desc: 'Envie um Pull Request. Seu commit aparece aqui automaticamente.' },
                { icon: MessageCircle, title: '4. Colabore', desc: 'Discuta nas issues, revise PRs. Cada ação é parte da Espiral.' },
              ].map(step => (
                <div key={step.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(19,182,236,0.1)', border: '1px solid rgba(19,182,236,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#13b6ec',
                  }}>
                    <step.icon size={14} />
                  </div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#fff', margin: '0 0 2px' }}>{step.title}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Overview */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8,
        marginBottom: 20,
      }}>
        {[
          { label: 'Commits', value: commits.length, icon: GitCommit, color: '#13b6ec' },
          { label: 'Adições', value: `+${totalStats.additions}`, icon: Plus, color: '#22c55e' },
          { label: 'Remoções', value: `-${totalStats.deletions}`, icon: Minus, color: '#ef4444' },
          { label: 'Arquivos', value: totalStats.filesChanged, icon: FolderTree, color: '#a78bfa' },
          { label: 'Autores', value: authors.length, icon: Users, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            padding: '12px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'center',
          }}>
            <s.icon size={14} style={{ color: s.color, marginBottom: 4 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Activity Chart + Module Breakdown — side by side on desktop */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12,
        marginBottom: 24,
      }}>
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <BarChart3 size={12} style={{ color: '#13b6ec' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Atividade (7 dias)
            </span>
          </div>
          <ActivityMiniChart commits={commits} />
        </div>
        <div style={{
          padding: 16, borderRadius: 12,
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <FolderTree size={12} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Módulos Alterados
            </span>
          </div>
          <ModuleBreakdown commits={commits} />
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            border: '1px solid',
            borderColor: !activeCategory ? 'rgba(19,182,236,0.4)' : 'rgba(255,255,255,0.08)',
            background: !activeCategory ? 'rgba(19,182,236,0.12)' : 'rgba(255,255,255,0.03)',
            color: !activeCategory ? '#13b6ec' : 'rgba(255,255,255,0.45)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Todos ({messages.length})
        </button>
        {(Object.entries(categoryConfig) as [CommitCategory, typeof categoryConfig[CommitCategory]][]).map(([key, cfg]) => {
          const count = categoryCounts[key] || 0;
          if (count === 0) return null;
          const isActive = activeCategory === key;
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(isActive ? null : key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                border: '1px solid',
                borderColor: isActive ? `${cfg.color}50` : 'rgba(255,255,255,0.08)',
                background: isActive ? `${cfg.color}15` : 'rgba(255,255,255,0.03)',
                color: isActive ? cfg.color : 'rgba(255,255,255,0.45)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <Icon size={10} /> {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Author Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {authors.slice(0, 6).map(([name, data]) => (
          <button
            key={name}
            onClick={() => setActiveAuthor(activeAuthor === name ? null : name)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 500,
              border: '1px solid',
              borderColor: activeAuthor === name ? 'rgba(19,182,236,0.3)' : 'rgba(255,255,255,0.06)',
              background: activeAuthor === name ? 'rgba(19,182,236,0.1)' : 'rgba(255,255,255,0.02)',
              color: activeAuthor === name ? '#13b6ec' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {data.avatar && (
              <img src={data.avatar} alt={name} style={{ width: 14, height: 14, borderRadius: '50%' }} />
            )}
            {name.split(' ')[0]} ({data.count})
          </button>
        ))}
      </div>

      {/* Commit Thread */}
      <div style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid rgba(19,182,236,0.08)' }}>
        <AnimatePresence>
          {visible.map((msg, i) => {
            const cfg = categoryConfig[msg.category];
            const Icon = cfg.icon;
            const isExpanded = expandedSha === msg.commit.sha;
            const hasStats = msg.commit.stats && msg.commit.stats.total > 0;
            const hasFiles = msg.commit.files && msg.commit.files.length > 0;

            return (
              <motion.div
                key={msg.commit.sha}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                style={{ position: 'relative', marginBottom: 8 }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute', left: -31, top: 14,
                  width: 10, height: 10, borderRadius: '50%',
                  background: cfg.color, opacity: 0.8,
                  boxShadow: `0 0 6px ${cfg.color}40`,
                }} />

                {/* Card */}
                <div
                  onClick={() => setExpandedSha(isExpanded ? null : msg.commit.sha)}
                  style={{
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    background: isExpanded ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isExpanded ? 'rgba(19,182,236,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        padding: '2px 7px', borderRadius: 6,
                        background: `${cfg.color}12`, border: `1px solid ${cfg.color}20`,
                      }}>
                        <Icon size={9} style={{ color: cfg.color }} />
                        <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                        {msg.commit.author.split(' ')[0]}
                      </span>
                      {msg.module !== 'other' && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 4,
                          background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)',
                          fontFamily: 'monospace',
                        }}>
                          {msg.module}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasStats && <DiffBar additions={msg.commit.stats!.additions} deletions={msg.commit.stats!.deletions} />}
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                        {msg.commit.sha.slice(0, 7)}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: 'rgba(255,255,255,0.25)' }}>
                        <Clock size={8} /> {timeAgo(msg.commit.date)}
                      </span>
                    </div>
                  </div>

                  {/* Message */}
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5, fontFamily: 'Space Grotesk, sans-serif' }}>
                    {msg.commit.message.split('\n')[0]}
                  </p>

                  {/* Expanded: File changes */}
                  {isExpanded && hasFiles && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                        <FolderTree size={10} style={{ color: 'rgba(255,255,255,0.3)' }} />
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {msg.commit.files!.length} arquivo{msg.commit.files!.length > 1 ? 's' : ''} alterado{msg.commit.files!.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {msg.commit.files!.map((f, fi) => {
                          const area = getAreaFromFile(f.filename);
                          return (
                            <div key={fi} style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px',
                              borderRadius: 6, background: 'rgba(255,255,255,0.02)',
                              fontSize: 11, fontFamily: 'monospace',
                            }}>
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                                background: areaColors[area] || '#64748b',
                              }} />
                              <span style={{
                                flex: 1, color: 'rgba(255,255,255,0.6)',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                              }}>
                                {f.filename}
                              </span>
                              <span style={{ color: '#22c55e', fontSize: 10 }}>+{f.additions}</span>
                              <span style={{ color: '#ef4444', fontSize: 10 }}>-{f.deletions}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                        <a
                          href={msg.commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '5px 12px', borderRadius: 6,
                            background: 'rgba(19,182,236,0.1)', color: '#13b6ec',
                            fontSize: 11, fontWeight: 600, textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={10} /> Ver diff completo no GitHub
                        </a>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Load More */}
        {visible.length < filtered.length && (
          <button
            onClick={() => setShowCount(s => s + 15)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              margin: '12px auto', padding: '8px 20px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <ChevronDown size={14} /> Mais {filtered.length - visible.length} commits
          </button>
        )}
      </div>

      {/* CTA */}
      <div style={{
        textAlign: 'center', marginTop: 32, padding: 20, borderRadius: 14,
        background: 'linear-gradient(135deg, rgba(19,182,236,0.06), rgba(139,92,246,0.06))',
        border: '1px solid rgba(19,182,236,0.1)',
      }}>
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {avatarUrl && (
              <img src={avatarUrl} alt={username || ''} style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(19,182,236,0.4)' }} />
            )}
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>{username || 'Builder'}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                {username === 'enioxt' ? 'Proprietário' : 'Conectado via GitHub'}
              </p>
            </div>
            <a
              href={username === 'enioxt' ? 'https://github.com/enioxt/egos-lab' : 'https://github.com/enioxt/egos-lab/fork'}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8, marginLeft: 8,
                background: '#13b6ec', color: '#050508', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}
            >
              <Github size={13} /> {username === 'enioxt' ? 'Ver Repo' : 'Fork & Contribua'}
            </a>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
              Conecte seu GitHub para ver sua identidade nos commits e começar a contribuir.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={signInWithGitHub} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '9px 20px', borderRadius: 8, background: '#fff', color: '#0d1117',
                fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer',
              }}>
                <Github size={14} /> Entrar com GitHub
              </button>
              <a href="https://github.com/enioxt/egos-lab/fork" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '9px 18px', borderRadius: 8,
                background: 'rgba(19,182,236,0.1)', border: '1px solid rgba(19,182,236,0.25)',
                color: '#13b6ec', fontSize: 12, fontWeight: 700, textDecoration: 'none',
              }}>
                <ArrowUpRight size={13} /> Fork & Contribua
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ListeningSpiral;
