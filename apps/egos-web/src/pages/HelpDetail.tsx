import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { HubHelpRequest, HubHelpComment, HubHelpStatus } from '../types/hub'

const STATUS_COLORS: Record<HubHelpStatus, { label: string; color: string }> = {
  open: { label: 'Aberto', color: '#10b981' },
  needs_info: { label: 'Precisa info', color: '#f59e0b' },
  in_progress: { label: 'Em progresso', color: '#3b82f6' },
  solved: { label: 'Resolvido', color: '#8b5cf6' },
  closed: { label: 'Fechado', color: '#6b7280' },
}

export default function HelpDetail() {
  const { id } = useParams<{ id: string }>()
  const { user, isAuthenticated } = useAuth()
  const [request, setRequest] = useState<HubHelpRequest | null>(null)
  const [comments, setComments] = useState<HubHelpComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [projectSlug, setProjectSlug] = useState('')

  useEffect(() => {
    if (!id) return
    async function load() {
      const { data: req } = await supabase
        .from('hub_help_requests')
        .select('id, project_id, author_id, title, type, status, body, accepted_comment_id, comment_count, created_at')
        .eq('id', id)
        .single()

      if (!req) { setLoading(false); return }
      setRequest(req as HubHelpRequest)

      const { data: proj } = await supabase
        .from('hub_projects')
        .select('slug')
        .eq('id', req.project_id)
        .single()
      if (proj) setProjectSlug(proj.slug)

      const { data: cmts } = await supabase
        .from('hub_help_comments')
        .select('id, help_request_id, author_id, body, is_accepted, created_at')
        .eq('help_request_id', id)
        .order('created_at', { ascending: true })

      if (cmts) setComments(cmts as HubHelpComment[])
      setLoading(false)
    }
    load()
  }, [id])

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !id || !newComment.trim()) return
    setSubmitting(true)

    const { data, error } = await supabase
      .from('hub_help_comments')
      .insert({
        help_request_id: id,
        author_id: user.id,
        body: newComment.trim(),
      })
      .select('id, help_request_id, author_id, body, is_accepted, created_at')
      .single()

    if (!error && data) {
      setComments((prev: HubHelpComment[]) => [...prev, data as HubHelpComment])
      setNewComment('')
    }
    setSubmitting(false)
  }

  async function handleAccept(commentId: string) {
    if (!request || !user) return
    await supabase
      .from('hub_help_requests')
      .update({ accepted_comment_id: commentId, status: 'solved' as HubHelpStatus })
      .eq('id', request.id)

    await supabase
      .from('hub_help_comments')
      .update({ is_accepted: true })
      .eq('id', commentId)

    setRequest((prev: HubHelpRequest | null) => prev ? { ...prev, accepted_comment_id: commentId, status: 'solved' as HubHelpStatus } : prev)
    setComments((prev: HubHelpComment[]) => prev.map((c: HubHelpComment) => c.id === commentId ? { ...c, is_accepted: true } : c))
  }

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

  if (!request) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">🔍</div>
          <h3>Pedido não encontrado</h3>
          <p><Link to="/projects">Voltar aos projetos</Link></p>
        </div>
      </section>
    )
  }

  const status = STATUS_COLORS[request.status]
  const isAuthor = user?.id === request.author_id

  return (
    <section className="hub-page">
      <Link to={projectSlug ? `/p/${projectSlug}/help` : '/projects'} className="hub-back">← Pedidos de ajuda</Link>

      <div className="help-detail">
        <div className="help-detail-header">
          <h1 className="hub-detail-title">{request.title}</h1>
          <span className="hub-status-badge" style={{ backgroundColor: status.color + '22', color: status.color, borderColor: status.color + '44' }}>
            {status.label}
          </span>
        </div>

        <div className="help-detail-body">
          <p style={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>{request.body}</p>
        </div>

        <div className="help-comments">
          <h2 className="hub-section-title">💬 Respostas ({comments.length})</h2>

          {comments.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Nenhuma resposta ainda. Seja o primeiro!</p>
          ) : (
            <div className="help-comments-list">
              {comments.map((c: HubHelpComment) => (
                <div key={c.id} className={`help-comment ${c.is_accepted ? 'accepted' : ''}`}>
                  <div className="help-comment-body">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{c.body}</p>
                  </div>
                  <div className="help-comment-footer">
                    <span className="help-comment-date">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                    {c.is_accepted && <span className="help-accepted-badge">✅ Aceita</span>}
                    {isAuthor && !request.accepted_comment_id && !c.is_accepted && (
                      <button onClick={() => handleAccept(c.id)} className="help-accept-btn">
                        Aceitar resposta
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAuthenticated && request.status !== 'closed' && (
            <form onSubmit={handleComment} className="help-comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="hub-textarea"
                rows={4}
                placeholder="Escreva sua resposta..."
                required
              />
              <button type="submit" className="hub-btn-primary" disabled={submitting || !newComment.trim()}>
                {submitting ? 'Enviando...' : 'Responder'}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
