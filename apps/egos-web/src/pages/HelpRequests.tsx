import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { HubHelpRequest, HubHelpStatus, HubHelpType } from '../types/hub'

const STATUS_COLORS: Record<HubHelpStatus, { label: string; color: string }> = {
  open: { label: 'Aberto', color: '#10b981' },
  needs_info: { label: 'Precisa info', color: '#f59e0b' },
  in_progress: { label: 'Em progresso', color: '#3b82f6' },
  solved: { label: 'Resolvido', color: '#8b5cf6' },
  closed: { label: 'Fechado', color: '#6b7280' },
}

const TYPE_ICONS: Record<HubHelpType, string> = {
  bug: '🐛',
  setup: '🔧',
  keys: '🔑',
  billing: '💳',
  performance: '⚡',
  architecture: '🏗️',
  feature: '✨',
}

export default function HelpRequests() {
  const { slug } = useParams<{ slug: string }>()
  const { isAuthenticated } = useAuth()
  const [requests, setRequests] = useState<HubHelpRequest[]>([])
  const [projectTitle, setProjectTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data: proj } = await supabase
        .from('hub_projects')
        .select('id, title')
        .eq('slug', slug)
        .single()

      if (!proj) { setLoading(false); return }
      setProjectTitle(proj.title)

      const { data } = await supabase
        .from('hub_help_requests')
        .select('id, project_id, author_id, title, type, status, body, comment_count, created_at')
        .eq('project_id', proj.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (data) setRequests(data as HubHelpRequest[])
      setLoading(false)
    }
    load()
  }, [slug])

  return (
    <section className="hub-page">
      <div className="hub-header">
        <Link to={`/p/${slug}`} className="hub-back">← {projectTitle || 'Projeto'}</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="hub-title">Pedidos de Ajuda</h1>
          {isAuthenticated && (
            <Link to={`/p/${slug}/help/new`} className="hub-btn-primary">+ Novo pedido</Link>
          )}
        </div>
        <p className="hub-subtitle">Precisa de ajuda? Abra um pedido. Sabe resolver? Responda.</p>
      </div>

      {loading ? (
        <div className="hub-loading">
          {[1,2,3].map(i => <div key={i} className="hub-skeleton-card" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="hub-empty">
          <div className="hub-empty-icon">🤝</div>
          <h3>Nenhum pedido de ajuda ainda</h3>
          <p>Seja o primeiro a pedir ou oferecer ajuda neste projeto.</p>
        </div>
      ) : (
        <div className="help-list">
          {requests.map((req: HubHelpRequest) => {
            const status = STATUS_COLORS[req.status]
            return (
              <Link to={`/help/${req.id}`} key={req.id} className="help-card">
                <div className="help-card-left">
                  <span className="help-type-icon">{TYPE_ICONS[req.type] || '❓'}</span>
                  <div>
                    <h3 className="help-card-title">{req.title}</h3>
                    <p className="help-card-body">{req.body.slice(0, 100)}{req.body.length > 100 ? '...' : ''}</p>
                  </div>
                </div>
                <div className="help-card-right">
                  <span className="hub-status-badge" style={{ backgroundColor: status.color + '22', color: status.color, borderColor: status.color + '44' }}>
                    {status.label}
                  </span>
                  <span className="hub-card-stat">💬 {req.comment_count}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
