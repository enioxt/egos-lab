import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { HubHelpType } from '../types/hub'

const HELP_TYPES: { value: HubHelpType; label: string; icon: string }[] = [
  { value: 'bug', label: 'Bug', icon: '🐛' },
  { value: 'setup', label: 'Setup', icon: '🔧' },
  { value: 'keys', label: 'Chaves/API', icon: '🔑' },
  { value: 'billing', label: 'Custos', icon: '💳' },
  { value: 'performance', label: 'Performance', icon: '⚡' },
  { value: 'architecture', label: 'Arquitetura', icon: '🏗️' },
  { value: 'feature', label: 'Feature', icon: '✨' },
]

export default function NewHelpRequest() {
  const { slug } = useParams<{ slug: string }>()
  const { user, isAuthenticated, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [projectId, setProjectId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<HubHelpType>('bug')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!slug) return
    async function load() {
      const { data } = await supabase
        .from('hub_projects')
        .select('id')
        .eq('slug', slug)
        .single()
      if (data) setProjectId(data.id)
    }
    load()
  }, [slug])

  if (!isAuthenticated) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">🔒</div>
          <h3>Login necessário</h3>
          <p>Faça login para criar um pedido de ajuda.</p>
          <button onClick={signInWithGitHub} className="auth-github-btn" style={{ marginTop: 16 }}>
            Login com GitHub
          </button>
        </div>
      </section>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !projectId || !title.trim() || !body.trim()) return
    setSubmitting(true)
    setError('')

    const { error: insertError } = await supabase
      .from('hub_help_requests')
      .insert({
        project_id: projectId,
        author_id: user.id,
        title: title.trim(),
        type,
        body: body.trim(),
        status: 'open',
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    navigate(`/p/${slug}/help`)
  }

  return (
    <section className="hub-page">
      <div className="hub-header">
        <Link to={`/p/${slug}/help`} className="hub-back">← Pedidos de ajuda</Link>
        <h1 className="hub-title">Novo Pedido de Ajuda</h1>
      </div>

      <form onSubmit={handleSubmit} className="wizard-card">
        <label className="wizard-label">Tipo</label>
        <div className="help-type-grid">
          {HELP_TYPES.map(ht => (
            <button
              key={ht.value}
              type="button"
              onClick={() => setType(ht.value)}
              className={`help-type-btn ${type === ht.value ? 'active' : ''}`}
            >
              <span>{ht.icon}</span>
              <span>{ht.label}</span>
            </button>
          ))}
        </div>

        <label className="wizard-label">Título</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="hub-search"
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Resumo do problema..."
          required
        />

        <label className="wizard-label">Descrição</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="hub-textarea"
          rows={8}
          placeholder="Descreva o problema em detalhes. Cole logs, prints de erro, etc."
          required
        />

        {error && <p className="wizard-error">{error}</p>}

        <div className="wizard-nav">
          <Link to={`/p/${slug}/help`} className="hub-btn-secondary">Cancelar</Link>
          <button type="submit" className="hub-btn-primary" disabled={submitting || !title.trim() || !body.trim()}>
            {submitting ? 'Enviando...' : 'Publicar Pedido'}
          </button>
        </div>
      </form>
    </section>
  )
}
