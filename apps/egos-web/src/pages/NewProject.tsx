import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/i)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

export default function NewProject() {
  const { user, isAuthenticated, signInWithGitHub } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'url' | 'details' | 'runbook' | 'submitting'>('url')
  const [githubUrl, setGithubUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [techStack, setTechStack] = useState('')
  const [tags, setTags] = useState('')
  const [prerequisites, setPrerequisites] = useState('')
  const [installSteps, setInstallSteps] = useState('')
  const [runCommand, setRunCommand] = useState('')
  const [envTemplate, setEnvTemplate] = useState('')
  const [monthlyCost, setMonthlyCost] = useState('')
  const [submitError, setSubmitError] = useState('')

  if (!isAuthenticated) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">🔒</div>
          <h3>Login necessário</h3>
          <p>Você precisa estar logado para publicar um projeto.</p>
          <button onClick={signInWithGitHub} className="auth-github-btn" style={{ marginTop: 16 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Login com GitHub
          </button>
        </div>
      </section>
    )
  }

  function handleUrlNext() {
    const parsed = parseGitHubUrl(githubUrl)
    if (!parsed) {
      setUrlError('Cole uma URL válida do GitHub (ex: https://github.com/user/repo)')
      return
    }
    setUrlError('')
    if (!title) setTitle(parsed.repo.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()))
    setStep('details')
  }

  async function handleSubmit() {
    if (!user) return
    setStep('submitting')
    setSubmitError('')

    const parsed = parseGitHubUrl(githubUrl)
    if (!parsed) return

    const slug = slugify(title || parsed.repo)
    const techArr = techStack.split(',').map((s: string) => s.trim()).filter(Boolean)
    const tagsArr = tags.split(',').map((s: string) => s.trim()).filter(Boolean)

    const { data: project, error: projError } = await supabase
      .from('hub_projects')
      .insert({
        owner_id: user.id,
        slug,
        title: title || parsed.repo,
        description: description || null,
        github_url: githubUrl.trim(),
        github_repo: `${parsed.owner}/${parsed.repo}`,
        status: 'functioning',
        visibility: 'public',
        tags: tagsArr,
        tech_stack: techArr,
      })
      .select('id, slug')
      .single()

    if (projError) {
      setSubmitError(projError.message)
      setStep('runbook')
      return
    }

    if (project && (prerequisites || installSteps || runCommand || envTemplate)) {
      await supabase.from('hub_project_runbooks').insert({
        project_id: project.id,
        prerequisites: prerequisites || null,
        install_steps: installSteps || null,
        run_command: runCommand || null,
        env_template: envTemplate || null,
        estimated_monthly_cost: monthlyCost || null,
        keys_needed: [],
        docker_available: false,
      })
    }

    navigate(`/p/${project?.slug || slug}`)
  }

  return (
    <section className="hub-page">
      <div className="hub-header">
        <Link to="/projects" className="hub-back">← Projetos</Link>
        <h1 className="hub-title">Publicar Projeto</h1>
        <p className="hub-subtitle">Cole a URL do seu repositório GitHub e preencha o runbook.</p>
      </div>

      <div className="wizard-steps">
        <div className={`wizard-step ${step === 'url' ? 'active' : 'done'}`}>1. Repositório</div>
        <div className={`wizard-step ${step === 'details' ? 'active' : step === 'runbook' || step === 'submitting' ? 'done' : ''}`}>2. Detalhes</div>
        <div className={`wizard-step ${step === 'runbook' || step === 'submitting' ? 'active' : ''}`}>3. Como Rodar</div>
      </div>

      {step === 'url' && (
        <div className="wizard-card">
          <label className="wizard-label">URL do Repositório GitHub</label>
          <input
            type="url"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            className="hub-search"
            style={{ width: '100%', marginBottom: 8 }}
            autoFocus
          />
          {urlError && <p className="wizard-error">{urlError}</p>}
          <button onClick={handleUrlNext} className="hub-btn-primary" style={{ marginTop: 12 }}>
            Continuar →
          </button>
        </div>
      )}

      {step === 'details' && (
        <div className="wizard-card">
          <label className="wizard-label">Nome do Projeto</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} />

          <label className="wizard-label">Descrição curta</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="hub-textarea" rows={3} placeholder="O que o projeto faz..." />

          <label className="wizard-label">Tech Stack (separado por vírgula)</label>
          <input type="text" value={techStack} onChange={(e) => setTechStack(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder="React, Node.js, Supabase" />

          <label className="wizard-label">Tags (separado por vírgula)</label>
          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder="saas, ai, marketplace" />

          <div className="wizard-nav">
            <button onClick={() => setStep('url')} className="hub-btn-secondary">← Voltar</button>
            <button onClick={() => setStep('runbook')} className="hub-btn-primary">Continuar →</button>
          </div>
        </div>
      )}

      {(step === 'runbook' || step === 'submitting') && (
        <div className="wizard-card">
          <p className="wizard-hint">Preencha o que souber — você pode editar depois.</p>

          <label className="wizard-label">Pré-requisitos</label>
          <textarea value={prerequisites} onChange={(e) => setPrerequisites(e.target.value)} className="hub-textarea" rows={2} placeholder="Node 20+, Docker (opcional)" />

          <label className="wizard-label">Passos de Instalação</label>
          <textarea value={installSteps} onChange={(e) => setInstallSteps(e.target.value)} className="hub-textarea" rows={3} placeholder="git clone ...\nnpm install\ncp .env.example .env" />

          <label className="wizard-label">Comando para Rodar</label>
          <input type="text" value={runCommand} onChange={(e) => setRunCommand(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder="npm run dev" />

          <label className="wizard-label">Template .env</label>
          <textarea value={envTemplate} onChange={(e) => setEnvTemplate(e.target.value)} className="hub-textarea" rows={3} placeholder="DATABASE_URL=\nAPI_KEY=\nSECRET=" />

          <label className="wizard-label">Custo mensal estimado</label>
          <input type="text" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder="$0 (free tier)" />

          {submitError && <p className="wizard-error">{submitError}</p>}

          <div className="wizard-nav">
            <button onClick={() => setStep('details')} className="hub-btn-secondary" disabled={step === 'submitting'}>← Voltar</button>
            <button onClick={handleSubmit} className="hub-btn-primary" disabled={step === 'submitting'}>
              {step === 'submitting' ? 'Publicando...' : 'Publicar Projeto'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
