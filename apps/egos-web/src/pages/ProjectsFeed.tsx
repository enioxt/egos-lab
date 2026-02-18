import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { HubProject, HubProjectStatus } from '../types/hub'

const STATUS_LABELS: Record<HubProjectStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: '#6b7280' },
  functioning: { label: 'Funcionando', color: '#10b981' },
  in_progress: { label: 'Em progresso', color: '#3b82f6' },
  stuck: { label: 'Travado', color: '#ef4444' },
  seeking_help: { label: 'Precisa ajuda', color: '#f59e0b' },
  archived: { label: 'Arquivado', color: '#6b7280' },
}

const TAG_COLORS = ['#8b5cf6', '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1']

export default function ProjectsFeed() {
  const [projects, setProjects] = useState<HubProject[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  async function loadProjects() {
    setLoading(true)
    const { data, error } = await supabase
      .from('hub_projects')
      .select('id, slug, title, description, github_url, github_repo, status, visibility, tags, tech_stack, star_count, comment_count, created_at, owner_id')
      .eq('visibility', 'public')
      .order('star_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      setProjects(data as HubProject[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filtered = projects.filter((p: HubProject) => {
    if (filter !== 'all' && p.status !== filter) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  return (
    <section className="hub-page">
      <div className="hub-header">
        <div>
          <h1 className="hub-title">Projetos do Ecossistema</h1>
          <p className="hub-subtitle">
            Explore projetos open-source da comunidade EGOS. Cada projeto inclui documentação,
            stack técnica e status atual. Você pode contribuir, pedir ajuda ou publicar o seu.
          </p>
        </div>
      </div>

      <div className="hub-filters">
        <input
          type="text"
          placeholder="Buscar por nome, tecnologia ou tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hub-search"
        />
        <div className="hub-filter-chips">
          {['all', 'functioning', 'in_progress', 'seeking_help'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`hub-chip ${filter === s ? 'active' : ''}`}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s as HubProjectStatus]?.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="hub-loading">
          {[1,2,3].map(i => <div key={i} className="hub-skeleton-card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="hub-empty">
          <div className="hub-empty-icon">�</div>
          <h3>Nenhum projeto publicado ainda</h3>
          <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '8px auto 16px', lineHeight: 1.6 }}>
            Aqui aparecerão os projetos da comunidade EGOS. Para publicar o seu,
            clique em <strong style={{ color: '#13b6ec' }}>+ Projeto</strong> no menu superior
            e cole a URL do repositório GitHub.
          </p>
          <Link to="/new-project" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 10, background: '#13b6ec',
            color: '#050508', fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            + Publicar Primeiro Projeto
          </Link>
        </div>
      ) : (
        <div className="hub-grid">
          {filtered.map((project: HubProject) => {
            const status = STATUS_LABELS[project.status]
            return (
              <Link to={`/p/${project.slug}`} key={project.id} className="hub-card">
                <div className="hub-card-header">
                  <h3 className="hub-card-title">{project.title}</h3>
                  <span className="hub-status-badge" style={{ backgroundColor: status.color + '22', color: status.color, borderColor: status.color + '44' }}>
                    {status.label}
                  </span>
                </div>
                {project.description && (
                  <p className="hub-card-desc">{project.description.slice(0, 120)}{project.description.length > 120 ? '...' : ''}</p>
                )}
                <div className="hub-card-tags">
                  {project.tech_stack.slice(0, 4).map((t: string, i: number) => (
                    <span key={t} className="hub-tag" style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] + '22', color: TAG_COLORS[i % TAG_COLORS.length] }}>
                      {t}
                    </span>
                  ))}
                  {project.tech_stack.length > 4 && (
                    <span className="hub-tag-more">+{project.tech_stack.length - 4}</span>
                  )}
                </div>
                <div className="hub-card-footer">
                  <span className="hub-card-stat">⭐ {project.star_count}</span>
                  <span className="hub-card-stat">💬 {project.comment_count}</span>
                  <span className="hub-card-repo">{project.github_repo}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
