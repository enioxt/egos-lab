import { useState, useEffect, useCallback } from 'react'
import './AuditHub.css'

interface AgentResult {
    agent_id: string
    agent_name: string
    status: string
    findings: number
    errors: number
    warnings: number
    info: number
    criticals: number
    duration_ms: number
    error_message?: string
}

interface AuditSummary {
    task_id: string
    agent_id: string
    repo_url: string
    status: string
    health_score: number
    findings_errors: number
    findings_warnings: number
    findings_info: number
    duration_ms: number
    completed_at: string
}

type Phase = 'idle' | 'submitting' | 'polling' | 'done' | 'error'

export default function AuditHub() {
    const [repoUrl, setRepoUrl] = useState('')
    const [githubToken, setGithubToken] = useState('')
    const [isPrivate, setIsPrivate] = useState(false)
    const [phase, setPhase] = useState<Phase>('idle')
    const [taskId, setTaskId] = useState<string | null>(null)
    const [audit, setAudit] = useState<AuditSummary | null>(null)
    const [agents, setAgents] = useState<AgentResult[]>([])
    const [error, setError] = useState<string | null>(null)
    const [recentAudits, setRecentAudits] = useState<AuditSummary[]>([])
    const [pollCount, setPollCount] = useState(0)

    // Load recent audits on mount
    useEffect(() => {
        fetch('/api/audit-results')
            .then(r => r.json())
            .then(d => d.audits && setRecentAudits(d.audits))
            .catch(() => { })
    }, [])

    // Poll for results
    useEffect(() => {
        if (phase !== 'polling' || !taskId) return
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/audit-results?id=${taskId}`)
                if (!res.ok) {
                    setPollCount(c => c + 1)
                    if (pollCount > 30) { // Give up after ~60s
                        setPhase('error')
                        setError('Audit timed out. The repository may be too large.')
                        clearInterval(interval)
                    }
                    return
                }
                const data = await res.json()
                if (data.audit) {
                    setAudit(data.audit)
                    setAgents(data.agents || [])
                    setPhase('done')
                    clearInterval(interval)
                }
            } catch {
                setPollCount(c => c + 1)
            }
        }, 2000)
        return () => clearInterval(interval)
    }, [phase, taskId, pollCount])

    const handleSubmit = useCallback(async () => {
        if (!repoUrl.trim()) return
        if (isPrivate && !githubToken.trim()) {
            setError('Para repositórios privados, forneça um GitHub Token (PAT).')
            return
        }

        setPhase('submitting')
        setError(null)
        setAudit(null)
        setAgents([])
        setPollCount(0)

        try {
            const res = await fetch('/api/run-audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    repoUrl: repoUrl.trim(),
                    githubToken: isPrivate ? githubToken.trim() : undefined
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                setPhase('error')
                setError(data.error || 'Failed to start audit')
                return
            }
            setTaskId(data.taskId)
            setPhase('polling')
        } catch (err: any) {
            setPhase('error')
            setError(err.message || 'Network error')
        }
    }, [repoUrl, isPrivate, githubToken])

    const statusIcon = (s: string) => {
        if (s === 'pass') return '✅'
        if (s === 'fail') return '❌'
        if (s === 'skip') return '⏭️'
        if (s === 'error') return '💥'
        if (s === 'timeout') return '⏱️'
        return '❓'
    }

    const severityColor = (s: string) => {
        if (s === 'pass') return 'var(--audit-green)'
        if (s === 'fail') return 'var(--audit-red)'
        if (s === 'skip') return 'var(--audit-yellow)'
        return 'var(--audit-muted)'
    }

    return (
        <div className="audit-hub">
            {/* Header */}
            <div className="audit-header">
                <h3 className="audit-title">🔍 Self-Service Audit</h3>
                <p className="audit-subtitle">
                    Cole a URL do seu repositório GitHub e receba uma análise completa de 14 agentes de IA em segundos.
                    <br />
                    <span className="audit-disclaimer">⚠️ Resultados preliminares — contribua com feedback para melhorar a análise.</span>
                </p>
            </div>

            {/* Input */}
            <div className="audit-input-container">
                <div className="audit-input-row" style={{ marginBottom: isPrivate ? '0.5rem' : '1.25rem' }}>
                    <input
                        type="url"
                        className="audit-input"
                        placeholder="https://github.com/owner/repo"
                        value={repoUrl}
                        onChange={e => setRepoUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        disabled={phase === 'submitting' || phase === 'polling'}
                    />
                    <button
                        className="audit-submit-btn"
                        onClick={handleSubmit}
                        disabled={phase === 'submitting' || phase === 'polling' || !repoUrl.trim()}
                    >
                        {phase === 'submitting' ? 'Enviando...' : phase === 'polling' ? 'Analisando...' : 'Auditar Repo'}
                    </button>
                </div>

                <div className="audit-private-toggle" style={{ marginBottom: '0.75rem', fontSize: '0.85rem', color: 'var(--audit-muted)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', width: 'fit-content' }}>
                        <input
                            type="checkbox"
                            checked={isPrivate}
                            onChange={e => setIsPrivate(e.target.checked)}
                            disabled={phase === 'submitting' || phase === 'polling'}
                        />
                        Repositório Privado?
                    </label>
                </div>

                {isPrivate && (
                    <div className="audit-token-row" style={{ marginBottom: '1.25rem' }}>
                        <input
                            type="password"
                            className="audit-input"
                            style={{ width: '100%', marginBottom: '0.5rem' }}
                            placeholder="GitHub Fine-Grained PAT (github_pat_...)"
                            value={githubToken}
                            onChange={e => setGithubToken(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                            disabled={phase === 'submitting' || phase === 'polling'}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--audit-green)', margin: 0, opacity: 0.9 }}>
                            🔒 O token é enviado via HTTPS, usado apenas para o clone dentro da nossa sandbox efêmera, e destruído imediatamente logo após. Nunca armazenamos tokens em banco de dados ou logs.
                        </p>
                    </div>
                )}
            </div>

            {/* Polling spinner */}
            {phase === 'polling' && (
                <div className="audit-polling">
                    <div className="audit-spinner" />
                    <span>Auditando repositório com 14 agentes... ({pollCount * 2}s)</span>
                </div>
            )}

            {/* Error */}
            {phase === 'error' && error && (
                <div className="audit-error">{error}</div>
            )}

            {/* Results */}
            {phase === 'done' && audit && (
                <div className="audit-results">
                    {/* Summary card */}
                    <div className="audit-summary-card">
                        <div className="audit-summary-header">
                            <div className="audit-repo-name">{audit.repo_url?.replace('https://github.com/', '')}</div>
                            <div className="audit-health" style={{ color: audit.health_score >= 80 ? 'var(--audit-green)' : audit.health_score >= 50 ? 'var(--audit-yellow)' : 'var(--audit-red)' }}>
                                {audit.health_score}% Health
                            </div>
                        </div>
                        <div className="audit-stats-row">
                            <div className="audit-stat">
                                <span className="audit-stat-value" style={{ color: 'var(--audit-red)' }}>{audit.findings_errors}</span>
                                <span className="audit-stat-label">Errors</span>
                            </div>
                            <div className="audit-stat">
                                <span className="audit-stat-value" style={{ color: 'var(--audit-yellow)' }}>{audit.findings_warnings}</span>
                                <span className="audit-stat-label">Warnings</span>
                            </div>
                            <div className="audit-stat">
                                <span className="audit-stat-value" style={{ color: 'var(--audit-blue)' }}>{audit.findings_info}</span>
                                <span className="audit-stat-label">Info</span>
                            </div>
                            <div className="audit-stat">
                                <span className="audit-stat-value">{(audit.duration_ms / 1000).toFixed(1)}s</span>
                                <span className="audit-stat-label">Duration</span>
                            </div>
                        </div>
                    </div>

                    {/* Per-agent cards */}
                    <div className="audit-agents-grid">
                        {agents.map(a => (
                            <div key={a.agent_id} className="audit-agent-card" style={{ borderLeftColor: severityColor(a.status) }}>
                                <div className="audit-agent-header">
                                    <span>{statusIcon(a.status)} {a.agent_name}</span>
                                    <span className="audit-agent-time">{(a.duration_ms / 1000).toFixed(1)}s</span>
                                </div>
                                <div className="audit-agent-findings">
                                    {a.criticals > 0 && <span className="audit-badge critical">{a.criticals} critical</span>}
                                    {a.errors > 0 && <span className="audit-badge error">{a.errors} errors</span>}
                                    {a.warnings > 0 && <span className="audit-badge warn">{a.warnings} warn</span>}
                                    {a.info > 0 && <span className="audit-badge info">{a.info} info</span>}
                                    {a.findings === 0 && a.status === 'pass' && <span className="audit-badge clean">Clean ✨</span>}
                                </div>
                                {a.error_message && <div className="audit-agent-error">{a.error_message}</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent audits */}
            {recentAudits.length > 0 && phase === 'idle' && (
                <div className="audit-recent">
                    <h4>Auditorias Recentes</h4>
                    <div className="audit-recent-list">
                        {recentAudits.slice(0, 5).map(a => (
                            <div key={a.task_id} className="audit-recent-item" onClick={() => { setTaskId(a.task_id); setPhase('polling'); setPollCount(0) }}>
                                <span className="audit-recent-repo">{a.repo_url?.replace('https://github.com/', '') || a.agent_id}</span>
                                <span className="audit-recent-score" style={{ color: (a.health_score ?? 0) >= 80 ? 'var(--audit-green)' : 'var(--audit-yellow)' }}>
                                    {a.health_score ?? '—'}%
                                </span>
                                <span className="audit-recent-date">
                                    {a.completed_at ? new Date(a.completed_at).toLocaleDateString('pt-BR') : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
