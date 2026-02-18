import React, { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitCommit, Sparkles, Bug, FileText, Wrench, Zap,
  Users, ArrowUpRight, Clock, MessageCircle, TrendingUp,
  ChevronDown, ExternalLink, Github
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
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

function extractTopic(msg: string): string {
  const match = msg.match(/^[a-z]+\(([^)]+)\)/);
  if (match) return match[1];
  const match2 = msg.match(/^[a-z]+:\s*(.{0,30})/);
  if (match2) return match2[1].trim();
  return msg.slice(0, 30);
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

const categoryConfig: Record<CommitCategory, { icon: React.ElementType; color: string; label: string }> = {
  feat:     { icon: Sparkles, color: '#13b6ec', label: 'Feature' },
  fix:      { icon: Bug, color: '#f59e0b', label: 'Fix' },
  docs:     { icon: FileText, color: '#a78bfa', label: 'Docs' },
  refactor: { icon: Wrench, color: '#6ee7b7', label: 'Refactor' },
  chore:    { icon: Zap, color: '#94a3b8', label: 'Chore' },
  other:    { icon: GitCommit, color: '#64748b', label: 'Commit' },
};

/* ── Component ── */
const ListeningSpiral: React.FC = () => {
  const { commits } = useAppStore();
  const { isAuthenticated, avatarUrl, username, signInWithGitHub } = useAuth();
  const [showCount, setShowCount] = useState(20);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(() =>
    [...commits]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(commit => ({
        commit,
        category: categorize(commit.message),
        topic: extractTopic(commit.message),
      })),
    [commits]
  );

  const visible = activeAuthor
    ? messages.filter(m => m.commit.author === activeAuthor).slice(0, showCount)
    : messages.slice(0, showCount);

  const authors = [...new Set(messages.map(m => m.commit.author))];
  const authorStats = authors.map(a => ({
    name: a,
    count: messages.filter(m => m.commit.author === a).length,
  })).sort((a, b) => b.count - a.count);

  const topicCounts = messages.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section id="spiral" style={{
      padding: '80px 24px 60px',
      maxWidth: 900,
      margin: '0 auto',
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: 40 }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 20,
          background: 'rgba(19, 182, 236, 0.08)',
          border: '1px solid rgba(19, 182, 236, 0.15)',
          marginBottom: 16,
        }}>
          <MessageCircle size={14} style={{ color: '#13b6ec' }} />
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: '#13b6ec',
            textTransform: 'uppercase',
          }}>Espiral de Escuta</span>
        </div>
        <h2 style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#fff',
          margin: '0 0 8px',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>Cada commit é uma mensagem</h2>
        <p style={{
          fontSize: 14,
          color: 'rgba(255,255,255,0.5)',
          maxWidth: 500,
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Aqui o código fala. Cada contribuição é parte de uma conversa coletiva — 
          builders colaborando através de commits, PRs e issues.
        </p>
      </motion.div>

      {/* Stats Bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {Object.entries(topicCounts).map(([cat, count]) => {
          const cfg = categoryConfig[cat as CommitCategory] || categoryConfig.other;
          const Icon = cfg.icon;
          return (
            <div key={cat} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Icon size={12} style={{ color: cfg.color }} />
              <span style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{count}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Contributors */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <button
          onClick={() => setActiveAuthor(null)}
          style={{
            padding: '4px 12px',
            borderRadius: 12,
            background: !activeAuthor ? 'rgba(19, 182, 236, 0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${!activeAuthor ? 'rgba(19, 182, 236, 0.3)' : 'rgba(255,255,255,0.06)'}`,
            color: !activeAuthor ? '#13b6ec' : 'rgba(255,255,255,0.5)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Users size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />
          Todos ({messages.length})
        </button>
        {authorStats.slice(0, 5).map(a => (
          <button
            key={a.name}
            onClick={() => setActiveAuthor(activeAuthor === a.name ? null : a.name)}
            style={{
              padding: '4px 12px',
              borderRadius: 12,
              background: activeAuthor === a.name ? 'rgba(19, 182, 236, 0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${activeAuthor === a.name ? 'rgba(19, 182, 236, 0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: activeAuthor === a.name ? '#13b6ec' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {a.name.split(' ')[0]} ({a.count})
          </button>
        ))}
      </div>

      {/* Thread */}
      <div ref={threadRef} style={{
        position: 'relative',
        paddingLeft: 28,
        borderLeft: '2px solid rgba(19, 182, 236, 0.1)',
      }}>
        <AnimatePresence>
          {visible.map((msg, i) => {
            const cfg = categoryConfig[msg.category];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={msg.commit.sha}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
                style={{
                  position: 'relative',
                  marginBottom: 16,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                whileHover={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(19, 182, 236, 0.15)',
                }}
                onClick={() => window.open(msg.commit.url, '_blank')}
              >
                {/* Timeline dot */}
                <div style={{
                  position: 'absolute',
                  left: -35,
                  top: 16,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: cfg.color,
                  opacity: 0.8,
                  boxShadow: `0 0 8px ${cfg.color}40`,
                }} />

                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '2px 8px',
                      borderRadius: 8,
                      background: `${cfg.color}15`,
                      border: `1px solid ${cfg.color}25`,
                    }}>
                      <Icon size={10} style={{ color: cfg.color }} />
                      <span style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                    </span>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'rgba(255,255,255,0.7)',
                    }}>{msg.commit.author.split(' ')[0]}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.3)',
                      fontFamily: 'monospace',
                    }}>{msg.commit.sha.slice(0, 7)}</span>
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 3,
                      fontSize: 10,
                      color: 'rgba(255,255,255,0.3)',
                    }}>
                      <Clock size={9} />
                      {timeAgo(msg.commit.date)}
                    </span>
                    <ExternalLink size={10} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  </div>
                </div>

                {/* Message */}
                <p style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.85)',
                  margin: 0,
                  lineHeight: 1.5,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {msg.commit.message.split('\n')[0]}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Load More */}
        {visible.length < messages.length && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCount(s => s + 20)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              margin: '16px auto',
              padding: '8px 20px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ChevronDown size={14} />
            Carregar mais ({messages.length - visible.length} restantes)
          </motion.button>
        )}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          textAlign: 'center',
          marginTop: 40,
          padding: '24px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(19, 182, 236, 0.06), rgba(139, 92, 246, 0.06))',
          border: '1px solid rgba(19, 182, 236, 0.1)',
        }}
      >
        {isAuthenticated ? (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
            }}>
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt={username || 'avatar'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: '2px solid rgba(19, 182, 236, 0.4)',
                  }}
                />
              )}
              <div style={{ textAlign: 'left' }}>
                <p style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  margin: 0,
                  fontFamily: 'Space Grotesk, sans-serif',
                }}>
                  {username || 'Builder'}
                </p>
                <p style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.4)',
                  margin: 0,
                }}>
                  {username === 'enioxt' ? 'Proprietário do projeto' : 'Conectado via GitHub'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              {username === 'enioxt' ? (
                <a
                  href="https://github.com/enioxt/egos-lab"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 20px',
                    borderRadius: 10,
                    background: '#13b6ec',
                    color: '#050508',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Github size={14} />
                  Ver Repositório
                </a>
              ) : (
                <a
                  href="https://github.com/enioxt/egos-lab/fork"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 20px',
                    borderRadius: 10,
                    background: '#13b6ec',
                    color: '#050508',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ArrowUpRight size={14} />
                  Fork & Contribua
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <TrendingUp size={20} style={{ color: '#13b6ec', marginBottom: 8 }} />
            <h3 style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 6px',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>Participe da Conversa</h3>
            <p style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)',
              margin: '0 0 16px',
              maxWidth: 400,
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.5,
            }}>
              Cada commit é sua voz. Conecte seu GitHub para identidade completa,
              ou faça fork e contribua diretamente.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={signInWithGitHub}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 24px',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#0d1117',
                  fontSize: 13,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Github size={16} />
                Entrar com GitHub
              </button>
              <a
                href="https://github.com/enioxt/egos-lab/fork"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: 'rgba(19, 182, 236, 0.1)',
                  border: '1px solid rgba(19, 182, 236, 0.25)',
                  color: '#13b6ec',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <ArrowUpRight size={14} />
                Fork & Contribua
              </a>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
};

export default ListeningSpiral;
