import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { API_REGISTRY, getRegistryStats } from '../lib/api-registry'
import type { RouteEntry, RouteStatus, AutomationLevel } from '../lib/api-registry'

const METHOD_COLORS: Record<string, string> = {
  GET: '#3b82f6',
  POST: '#10b981',
  PUT: '#f59e0b',
  PATCH: '#f97316',
  DELETE: '#ef4444',
}

const STATUS_STYLES: Record<RouteStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: '#10b981' },
  planned: { label: 'Planejado', color: '#8b5cf6' },
  deprecated: { label: 'Deprecated', color: '#f59e0b' },
  dead: { label: 'Morto', color: '#ef4444' },
}

const AUTOMATION_STYLES: Record<AutomationLevel, { label: string; icon: string; color: string }> = {
  full_auto: { label: 'Full Auto', icon: '⚡', color: '#10b981' },
  auto_review: { label: 'Auto + Review', icon: '🤖', color: '#3b82f6' },
  human_ai: { label: 'Human + AI', icon: '🧠', color: '#8b5cf6' },
  human_only: { label: 'Human Only', icon: '👤', color: '#6b7280' },
}

export default function ApiDocs() {
  const [search, setSearch] = useState('')
  const [appFilter, setAppFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [automationFilter, setAutomationFilter] = useState<string>('all')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  const stats = useMemo(() => getRegistryStats(), [])

  const filtered = useMemo(() => {
    return API_REGISTRY.filter((r: RouteEntry) => {
      if (search) {
        const q = search.toLowerCase()
        const match = r.path.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.category.includes(q) ||
          r.tags?.some((t: string) => t.includes(q))
        if (!match) return false
      }
      if (appFilter !== 'all' && r.app !== appFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (automationFilter !== 'all' && r.automation !== automationFilter) return false
      return true
    })
  }, [search, appFilter, statusFilter, automationFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, RouteEntry[]>()
    for (const r of filtered) {
      const arr = map.get(r.category) || []
      arr.push(r)
      map.set(r.category, arr)
    }
    return map
  }, [filtered])

  return (
    <section className="hub-page">
      <div className="hub-header">
        <Link to="/" className="hub-back">← Home</Link>
        <h1 className="hub-title">API Registry</h1>
        <p className="hub-subtitle">
          SSOT — {stats.total} routes across {Object.keys(stats.byApp).length} apps
        </p>
      </div>

      {/* Stats Grid */}
      <div className="api-stats-grid">
        <div className="api-stat-card">
          <span className="api-stat-value">{stats.total}</span>
          <span className="api-stat-label">Total Routes</span>
        </div>
        <div className="api-stat-card">
          <span className="api-stat-value" style={{ color: '#10b981' }}>{stats.byStatus?.active || 0}</span>
          <span className="api-stat-label">Active</span>
        </div>
        <div className="api-stat-card">
          <span className="api-stat-value" style={{ color: '#8b5cf6' }}>{stats.byStatus?.planned || 0}</span>
          <span className="api-stat-label">Planned</span>
        </div>
        <div className="api-stat-card">
          <span className="api-stat-value" style={{ color: '#3b82f6' }}>{stats.withAgent}</span>
          <span className="api-stat-label">With Agent</span>
        </div>
      </div>

      {/* Automation Breakdown */}
      <div className="api-automation-bar">
        {Object.entries(stats.byAutomation || {}).map(([level, count]) => {
          const style = AUTOMATION_STYLES[level as AutomationLevel]
          if (!style) return null
          const pct = ((count as number) / stats.total * 100).toFixed(0)
          return (
            <div
              key={level}
              className="api-automation-segment"
              style={{ flex: count as number, backgroundColor: style.color + '22', borderColor: style.color + '44' }}
              title={`${style.label}: ${count} routes (${pct}%)`}
            >
              <span>{style.icon}</span>
              <span className="api-automation-label">{count as number}</span>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="api-filters">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search routes, descriptions, tags..."
          className="hub-search"
          style={{ flex: 1 }}
        />
        <select value={appFilter} onChange={(e) => setAppFilter(e.target.value)} className="api-select">
          <option value="all">All Apps</option>
          {Object.keys(stats.byApp || {}).map((app: string) => (
            <option key={app} value={app}>{app} ({(stats.byApp as Record<string, number>)[app]})</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="api-select">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="deprecated">Deprecated</option>
        </select>
        <select value={automationFilter} onChange={(e) => setAutomationFilter(e.target.value)} className="api-select">
          <option value="all">All Automation</option>
          <option value="full_auto">Full Auto</option>
          <option value="auto_review">Auto + Review</option>
          <option value="human_ai">Human + AI</option>
          <option value="human_only">Human Only</option>
        </select>
      </div>

      {/* Results */}
      <p className="api-result-count">{filtered.length} routes matching</p>

      <div className="api-categories">
        {Array.from(grouped.entries()).map(([category, routes]) => (
          <div key={category} className="api-category">
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="api-category-header"
            >
              <span className="api-category-name">{category}</span>
              <span className="api-category-count">{routes.length}</span>
              <span className="api-category-chevron">{expandedCategory === category ? '▼' : '▶'}</span>
            </button>

            {expandedCategory === category && (
              <div className="api-routes-list">
                {routes.map((r: RouteEntry, i: number) => {
                  const statusStyle = STATUS_STYLES[r.status]
                  const autoStyle = AUTOMATION_STYLES[r.automation]
                  return (
                    <div key={`${r.path}-${i}`} className="api-route-card">
                      <div className="api-route-top">
                        <div className="api-route-methods">
                          {r.methods.map((m: string) => (
                            <span key={m} className="api-method-badge" style={{ backgroundColor: (METHOD_COLORS[m] || '#666') + '22', color: METHOD_COLORS[m] || '#666' }}>
                              {m}
                            </span>
                          ))}
                        </div>
                        <code className="api-route-path">{r.path}</code>
                        <div className="api-route-badges">
                          <span className="api-status-badge" style={{ color: statusStyle.color }}>{statusStyle.label}</span>
                          <span className="api-auto-badge" style={{ color: autoStyle.color }}>{autoStyle.icon} {autoStyle.label}</span>
                        </div>
                      </div>
                      <p className="api-route-desc">{r.description}</p>
                      <div className="api-route-meta">
                        <span className="api-route-app">{r.app}</span>
                        {r.auth && <span className="api-route-auth">🔒 Auth</span>}
                        {r.agent && <span className="api-route-agent">🤖 {r.agent}</span>}
                        {r.costPerCall && <span className="api-route-cost">{r.costPerCall}</span>}
                        {r.rateLimit && <span className="api-route-rate">{r.rateLimit}</span>}
                        {r.tags?.map((t: string) => <span key={t} className="hub-tag">{t}</span>)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
