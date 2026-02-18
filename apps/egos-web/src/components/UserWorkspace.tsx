import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GitFork, Star, ExternalLink, GitCommit, MessageCircle,
  HelpCircle, ChevronRight, BookOpen, Code2, Sparkles,
  AlertCircle, Copy, Check, Github
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface Repo {
  name: string
  full_name: string
  description: string | null
  html_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  pushed_at: string
  topics: string[]
  fork: boolean
}

interface EgosContributions {
  commits: number
  issues: number
  commitList: { sha: string; message: string; date: string }[]
}

interface UserData {
  repos: Repo[]
  egosContributions: EgosContributions
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C#': '#178600',
  CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051', Dart: '#00B4AB',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d atrás`
  return `${Math.floor(days / 30)}m atrás`
}

export default function UserWorkspace() {
  const { username, avatarUrl, isAuthenticated } = useAuth()
  const [data, setData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'repos' | 'contribute' | 'help'>('repos')
  const [copied, setCopied] = useState(false)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)

  useEffect(() => {
    if (!username) return
    let cancelled = false
    fetch(`/api/github-user?username=${username}`)
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [username])

  if (!isAuthenticated || !username) return null

  const hasEgosContribs = data?.egosContributions && data.egosContributions.commits > 0

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section style={{ padding: '0 24px 32px', maxWidth: 1200, margin: '0 auto' }}>
      {/* User Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        padding: '20px 24px', borderRadius: 16,
        background: 'linear-gradient(135deg, rgba(19,182,236,0.08), rgba(139,92,246,0.08))',
        border: '1px solid rgba(19,182,236,0.15)',
      }}>
        {avatarUrl && (
          <img src={avatarUrl} alt={username} style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '2px solid rgba(19,182,236,0.4)',
          }} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>
              Olá, {username}
            </h2>
            {hasEgosContribs && (
              <span style={{
                padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)',
              }}>
                Contribuidor EGOS
              </span>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
            {hasEgosContribs
              ? `${data!.egosContributions.commits} commits no EGOS Lab · ${data?.repos?.length || 0} repositórios públicos`
              : `${data?.repos?.length || 0} repositórios públicos · Pronto para contribuir`
            }
          </p>
        </div>
        <a
          href={`https://github.com/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none',
          }}
        >
          <Github size={14} /> Perfil
        </a>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {[
          { id: 'repos' as const, icon: <Code2 size={14} />, label: 'Seus Repos', count: data?.repos?.length },
          { id: 'contribute' as const, icon: <GitCommit size={14} />, label: 'Contribuir', count: hasEgosContribs ? data!.egosContributions.commits : undefined },
          { id: 'help' as const, icon: <HelpCircle size={14} />, label: 'Pedir Ajuda' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: activeTab === tab.id ? 'rgba(19,182,236,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.id ? '#13b6ec' : 'rgba(255,255,255,0.5)',
              border: activeTab === tab.id ? '1px solid rgba(19,182,236,0.3)' : '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
            {tab.count !== undefined && (
              <span style={{
                padding: '1px 6px', borderRadius: 4, fontSize: 10,
                background: activeTab === tab.id ? 'rgba(19,182,236,0.2)' : 'rgba(255,255,255,0.08)',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ═══ REPOS TAB ═══ */}
        {activeTab === 'repos' && (
          <motion.div
            key="repos"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s infinite' }} />
                ))}
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {data?.repos?.filter(r => !r.fork).slice(0, 8).map(repo => (
                    <motion.div
                      key={repo.name}
                      whileHover={{ scale: 1.01, borderColor: 'rgba(19,182,236,0.3)' }}
                      onClick={() => setSelectedRepo(selectedRepo?.name === repo.name ? null : repo)}
                      style={{
                        padding: 16, borderRadius: 12, cursor: 'pointer',
                        background: selectedRepo?.name === repo.name
                          ? 'rgba(19,182,236,0.08)' : 'rgba(255,255,255,0.03)',
                        border: selectedRepo?.name === repo.name
                          ? '1px solid rgba(19,182,236,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#13b6ec' }}>
                          {repo.name}
                        </h3>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'rgba(255,255,255,0.3)' }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      {repo.description && (
                        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>
                          {repo.description.slice(0, 80)}{repo.description.length > 80 ? '...' : ''}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                        {repo.language && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              width: 8, height: 8, borderRadius: '50%',
                              background: LANG_COLORS[repo.language] || '#666',
                            }} />
                            {repo.language}
                          </span>
                        )}
                        {repo.stargazers_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={10} /> {repo.stargazers_count}
                          </span>
                        )}
                        {repo.forks_count > 0 && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <GitFork size={10} /> {repo.forks_count}
                          </span>
                        )}
                        <span>{timeAgo(repo.pushed_at)}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Selected Repo Actions */}
                <AnimatePresence>
                  {selectedRepo && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden', marginTop: 16 }}
                    >
                      <div style={{
                        padding: 20, borderRadius: 12,
                        background: 'rgba(19,182,236,0.05)', border: '1px solid rgba(19,182,236,0.15)',
                      }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600, color: '#fff' }}>
                          Ações para <span style={{ color: '#13b6ec' }}>{selectedRepo.name}</span>
                        </h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <a
                            href={`${selectedRepo.html_url}/issues/new?title=Preciso+de+ajuda&body=%23%23+Onde+estou+travado%0A%0A%23%23+O+que+j%C3%A1+tentei%0A%0A%23%23+Ambiente%0A-+OS%3A+%0A-+Node%3A+%0A-+IDE%3A+`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                              borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                              background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
                              border: '1px solid rgba(245,158,11,0.25)',
                            }}
                          >
                            <AlertCircle size={13} /> Criar Issue (Pedir Ajuda)
                          </a>
                          <a
                            href={`${selectedRepo.html_url}/issues/new?title=Sugest%C3%A3o%3A+&labels=enhancement`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                              borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                              background: 'rgba(139,92,246,0.12)', color: '#8b5cf6',
                              border: '1px solid rgba(139,92,246,0.25)',
                            }}
                          >
                            <Sparkles size={13} /> Sugerir Melhoria
                          </a>
                          <a
                            href={`${selectedRepo.html_url}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                              borderRadius: 8, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                              background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          >
                            <Github size={13} /> Abrir no GitHub
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </motion.div>
        )}

        {/* ═══ CONTRIBUTE TAB ═══ */}
        {activeTab === 'contribute' && (
          <motion.div
            key="contribute"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* EGOS Lab contributions */}
            {hasEgosContribs && (
              <div style={{
                padding: 16, borderRadius: 12, marginBottom: 16,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)',
              }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GitCommit size={14} /> Seus commits no EGOS Lab
                </h4>
                {data!.egosContributions.commitList.map(c => (
                  <div key={c.sha} style={{
                    padding: '8px 12px', marginBottom: 6, borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)', fontSize: 12,
                  }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {c.message?.split('\n')[0]?.slice(0, 80)}
                    </span>
                    <span style={{ color: 'rgba(255,255,255,0.25)', marginLeft: 8, fontSize: 11 }}>
                      {timeAgo(c.date)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* How to contribute */}
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#fff' }}>
                Como contribuir para o EGOS Lab
              </h4>

              {[
                {
                  step: '1',
                  title: 'Fork & Clone',
                  color: '#13b6ec',
                  code: `git clone https://github.com/${username}/egos-lab.git\ncd egos-lab && npm install`,
                  desc: 'Faça fork do repositório e clone localmente',
                  action: { label: 'Fork no GitHub', url: 'https://github.com/enioxt/egos-lab/fork' },
                },
                {
                  step: '2',
                  title: 'Carregue as regras no IDE',
                  color: '#8b5cf6',
                  code: 'Cole no chat do seu IDE:\n"Leia .windsurfrules, .guarani/IDENTITY.md e TASKS.md.\nMe diga quais tasks P0/P1 estão pendentes."',
                  desc: 'O projeto tem regras de qualidade que o AI do IDE precisa seguir',
                },
                {
                  step: '3',
                  title: 'Crie um branch e implemente',
                  color: '#10b981',
                  code: 'git checkout -b feat/minha-contribuicao\n# ... implemente ...\ngit commit -m "feat: minha contribuição"',
                  desc: 'Use commits convencionais (feat:, fix:, docs:)',
                },
                {
                  step: '4',
                  title: 'Abra um Pull Request',
                  color: '#f59e0b',
                  desc: 'Descreva o que mudou, por quê, e como testar',
                  action: { label: 'Abrir PR', url: 'https://github.com/enioxt/egos-lab/compare' },
                },
              ].map(s => (
                <div key={s.step} style={{
                  display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${s.color}15`, color: s.color, fontWeight: 700, fontSize: 13,
                    border: `1px solid ${s.color}30`,
                  }}>
                    {s.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: s.color }}>
                      {s.title}
                    </h5>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                      {s.desc}
                    </p>
                    {s.code && (
                      <div style={{ position: 'relative' }}>
                        <pre style={{
                          padding: '10px 12px', borderRadius: 8, fontSize: 11,
                          background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.6)',
                          overflow: 'auto', margin: 0, lineHeight: 1.5,
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                          {s.code}
                        </pre>
                        <button
                          onClick={() => copyToClipboard(s.code!)}
                          style={{
                            position: 'absolute', top: 6, right: 6, padding: '3px 6px',
                            borderRadius: 4, fontSize: 10, cursor: 'pointer',
                            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        >
                          {copied ? <Check size={10} /> : <Copy size={10} />}
                        </button>
                      </div>
                    )}
                    {s.action && (
                      <a
                        href={s.action.url}
                        target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8,
                          padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                          textDecoration: 'none', background: `${s.color}15`, color: s.color,
                          border: `1px solid ${s.color}25`,
                        }}
                      >
                        {s.action.label} <ChevronRight size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ HELP TAB ═══ */}
        {activeTab === 'help' && (
          <motion.div
            key="help"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)',
            }}>
              <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageCircle size={16} /> Precisa de ajuda? Compartilhe!
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                Criar uma <strong style={{ color: '#f59e0b' }}>Issue no GitHub</strong> é a melhor forma de pedir ajuda.
                Outros desenvolvedores podem ver, responder, e contribuir com soluções.
              </p>

              <div style={{
                padding: 16, borderRadius: 10, marginBottom: 16,
                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <h5 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  <BookOpen size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Template de Issue
                </h5>
                <pre style={{
                  padding: '12px 14px', borderRadius: 8, fontSize: 11,
                  background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.55)',
                  overflow: 'auto', margin: 0, lineHeight: 1.6,
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
{`## Onde estou travado

[Descreva o problema ou onde precisa de ajuda]

## O que já tentei

- [ ] Li a documentação em .guarani/
- [ ] Pesquisei issues existentes
- [ ] Tentei: [descreva o que tentou]

## Ambiente
- OS: 
- Node: 
- IDE: Windsurf / Cursor / VS Code

## Screenshots ou logs

[Cole aqui]`}
                </pre>
                <button
                  onClick={() => copyToClipboard(`## Onde estou travado\n\n[Descreva o problema]\n\n## O que já tentei\n\n- [ ] Li a documentação em .guarani/\n- [ ] Pesquisei issues existentes\n- [ ] Tentei: [descreva]\n\n## Ambiente\n- OS: \n- Node: \n- IDE: \n\n## Screenshots ou logs\n\n[Cole aqui]`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 10,
                    padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500,
                    cursor: 'pointer', background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {copied ? <Check size={11} /> : <Copy size={11} />} Copiar template
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <a
                  href={`https://github.com/enioxt/egos-lab/issues/new?title=Ajuda%3A+&body=%23%23+Onde+estou+travado%0A%0A%23%23+O+que+j%C3%A1+tentei%0A%0A-%20%5B%20%5D%20Li%20a%20documenta%C3%A7%C3%A3o%20em%20.guarani%2F%0A-%20%5B%20%5D%20Pesquisei%20issues%20existentes%0A%0A%23%23+Ambiente%0A-+OS%3A+%0A-+Node%3A+%0A-+IDE%3A+&labels=help+wanted`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                    borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    background: 'rgba(245,158,11,0.15)', color: '#f59e0b',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                >
                  <AlertCircle size={14} /> Criar Issue no EGOS Lab
                </a>
                <a
                  href="https://github.com/enioxt/egos-lab/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22"
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px',
                    borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none',
                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <HelpCircle size={14} /> Ver Issues Abertas
                </a>
              </div>
            </div>

            {/* Espiral Sharing */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)',
            }}>
              <h5 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={13} /> Espiral de Escuta
              </h5>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                Cada commit e issue cria uma mensagem na <strong style={{ color: '#8b5cf6' }}>Espiral de Escuta</strong> abaixo.
                Seus pedidos de ajuda aparecem lá para outros builders verem e colaborarem.
                A comunidade cresce quando compartilhamos onde travamos.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
