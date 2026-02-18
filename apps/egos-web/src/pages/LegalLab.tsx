import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { HubLegalLabTask } from '../types/hub'

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#10b981',
  intermediate: '#3b82f6',
  advanced: '#f59e0b',
}

const TYPE_ICONS: Record<string, string> = {
  checklist: '☑️',
  prompt: '💡',
  playbook: '📘',
  snippet: '✂️',
}

export default function LegalLab() {
  const [tasks, setTasks] = useState<HubLegalLabTask[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('hub_legal_lab_tasks')
        .select('id, slug, title, description, type, content, order_index, difficulty, estimated_minutes, prerequisites')
        .order('order_index', { ascending: true })

      if (data) setTasks(data as HubLegalLabTask[])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <section className="hub-page">
      <div className="hub-header">
        <div>
          <h1 className="hub-title">🎓 LegalLab</h1>
          <p className="hub-subtitle">
            Do zero ao "alguém rodou meu projeto". Microtarefas práticas para aprender open-source.
          </p>
        </div>
      </div>

      <div className="legal-track-info">
        <div className="legal-track">
          <span className="legal-track-icon">🚀</span>
          <div>
            <strong>Trilha completa</strong>
            <p>10 microtarefas · ~2 horas · De conta GitHub até Pull Request</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="hub-loading">
          {[1,2,3,4].map(i => <div key={i} className="hub-skeleton-card" />)}
        </div>
      ) : (
        <div className="legal-tasks">
          {tasks.map((task: HubLegalLabTask, index: number) => {
            const isExpanded = expandedSlug === task.slug
            const diffColor = DIFFICULTY_COLORS[task.difficulty] || '#6b7280'
            return (
              <div key={task.id} className={`legal-task ${isExpanded ? 'expanded' : ''}`}>
                <button
                  className="legal-task-header"
                  onClick={() => setExpandedSlug(isExpanded ? null : task.slug)}
                >
                  <div className="legal-task-number">{index + 1}</div>
                  <div className="legal-task-info">
                    <h3 className="legal-task-title">
                      {TYPE_ICONS[task.type] || '📄'} {task.title}
                    </h3>
                    {task.description && <p className="legal-task-desc">{task.description}</p>}
                  </div>
                  <div className="legal-task-meta">
                    <span className="legal-difficulty" style={{ color: diffColor, borderColor: diffColor + '44', backgroundColor: diffColor + '11' }}>
                      {task.difficulty}
                    </span>
                    <span className="legal-time">~{task.estimated_minutes}min</span>
                  </div>
                  <span className="legal-chevron">{isExpanded ? '▲' : '▼'}</span>
                </button>
                {isExpanded && (
                  <div className="legal-task-content">
                    <div className="legal-markdown" dangerouslySetInnerHTML={{
                      __html: task.content
                        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/`([^`]+)`/g, '<code>$1</code>')
                        .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="hub-code"><code>$2</code></pre>')
                        .replace(/^- \[ \] (.*$)/gm, '<label class="legal-check"><input type="checkbox" disabled /> $1</label>')
                        .replace(/^- \[x\] (.*$)/gm, '<label class="legal-check checked"><input type="checkbox" checked disabled /> $1</label>')
                        .replace(/^- (.*$)/gm, '<li>$1</li>')
                        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
                        .replace(/\n\n/g, '<br/><br/>')
                        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                    }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
