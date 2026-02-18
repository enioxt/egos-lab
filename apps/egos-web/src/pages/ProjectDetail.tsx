import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { HubProject, HubProjectRunbook } from '../types/hub'

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [project, setProject] = useState<HubProject | null>(null)
  const [runbook, setRunbook] = useState<HubProjectRunbook | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data: proj } = await supabase
        .from('hub_projects')
        .select('id, slug, title, description, github_url, github_repo, status, visibility, tags, tech_stack, readme_html, star_count, comment_count, created_at, owner_id')
        .eq('slug', slug)
        .single()

      if (!proj) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProject(proj as HubProject)

      const { data: rb } = await supabase
        .from('hub_project_runbooks')
        .select('id, project_id, prerequisites, install_steps, run_command, env_template, keys_needed, estimated_monthly_cost, docker_available, notes')
        .eq('project_id', proj.id)
        .single()

      if (rb) setRunbook(rb as HubProjectRunbook)
      setLoading(false)
    }
    load()
  }, [slug])

  if (loading) {
    return (
      <section className="hub-page">
        <div className="hub-detail-skeleton">
          <div className="hub-skeleton-bar wide" />
          <div className="hub-skeleton-bar" />
          <div className="hub-skeleton-bar" />
        </div>
      </section>
    )
  }

  if (notFound || !project) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">🔍</div>
          <h3>Projeto não encontrado</h3>
          <p>Verifique o link ou <Link to="/projects">volte à lista</Link>.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="hub-page">
      <div className="hub-detail">
        <div className="hub-detail-header">
          <div>
            <Link to="/projects" className="hub-back">← Projetos</Link>
            <h1 className="hub-detail-title">{project.title}</h1>
            {project.description && <p className="hub-detail-desc">{project.description}</p>}
          </div>
          <div className="hub-detail-actions">
            <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="hub-btn-primary">
              GitHub ↗
            </a>
          </div>
        </div>

        <div className="hub-detail-meta">
          <span className="hub-card-stat">⭐ {project.star_count}</span>
          <span className="hub-card-stat">💬 {project.comment_count}</span>
          <span className="hub-card-repo">{project.github_repo}</span>
        </div>

        <div className="hub-detail-tags">
          {project.tech_stack.map((t: string) => (
            <span key={t} className="hub-tag">{t}</span>
          ))}
          {project.tags.map((t: string) => (
            <span key={t} className="hub-tag secondary">{t}</span>
          ))}
        </div>

        {runbook && (
          <div className="hub-runbook">
            <h2 className="hub-section-title">🏃 Como Rodar</h2>

            {runbook.prerequisites && (
              <div className="hub-runbook-section">
                <h3>Pré-requisitos</h3>
                <pre className="hub-code">{runbook.prerequisites}</pre>
              </div>
            )}

            {runbook.install_steps && (
              <div className="hub-runbook-section">
                <h3>Instalação</h3>
                <pre className="hub-code">{runbook.install_steps}</pre>
              </div>
            )}

            {runbook.run_command && (
              <div className="hub-runbook-section">
                <h3>Comando para rodar</h3>
                <pre className="hub-code">{runbook.run_command}</pre>
              </div>
            )}

            {runbook.env_template && (
              <div className="hub-runbook-section">
                <h3>Variáveis de Ambiente (.env)</h3>
                <pre className="hub-code">{runbook.env_template}</pre>
              </div>
            )}

            {runbook.keys_needed && runbook.keys_needed.length > 0 && (
              <div className="hub-runbook-section">
                <h3>🔑 Chaves Necessárias</h3>
                <div className="hub-keys-grid">
                  {runbook.keys_needed.map((k: { name: string; where_to_get: string; estimated_cost: string; required: boolean }) => (
                    <div key={k.name} className="hub-key-card">
                      <div className="hub-key-name">
                        {k.name}
                        {k.required && <span className="hub-key-required">obrigatório</span>}
                      </div>
                      <div className="hub-key-source">{k.where_to_get}</div>
                      {k.estimated_cost && <div className="hub-key-cost">~{k.estimated_cost}/mês</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {runbook.estimated_monthly_cost && (
              <div className="hub-cost-badge">
                💰 Custo estimado: <strong>{runbook.estimated_monthly_cost}/mês</strong>
              </div>
            )}

            {runbook.notes && (
              <div className="hub-runbook-section">
                <h3>Notas</h3>
                <p>{runbook.notes}</p>
              </div>
            )}
          </div>
        )}

        {project.readme_html && (
          <div className="hub-readme">
            <h2 className="hub-section-title">📖 README</h2>
            <div className="hub-readme-content" dangerouslySetInnerHTML={{ __html: project.readme_html }} />
          </div>
        )}
      </div>
    </section>
  )
}
