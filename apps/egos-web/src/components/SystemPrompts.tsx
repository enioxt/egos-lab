import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileCode, Shield, Brain, BookOpen, Settings, ChevronRight,
  ExternalLink, Copy, Check
} from 'lucide-react'

interface FileEntry {
  id: string
  path: string
  label: string
  icon: React.ReactNode
  description: string
  color: string
}

const FILES: FileEntry[] = [
  {
    id: 'identity', path: '.guarani/IDENTITY.md',
    label: 'Identidade do Agente', icon: <Brain size={14} />,
    description: 'Quem é o agente EGOS — valores, missão e código sagrado',
    color: '#8b5cf6',
  },
  {
    id: 'preferences', path: '.guarani/PREFERENCES.md',
    label: 'Regras de Código', icon: <Settings size={14} />,
    description: 'Padrões de código, convenções e limites de tamanho',
    color: '#13b6ec',
  },
  {
    id: 'windsurfrules', path: '.windsurfrules',
    label: '.windsurfrules', icon: <Shield size={14} />,
    description: 'Regras globais do agente — mandamentos, MCPs, workflow triggers',
    color: '#10b981',
  },
  {
    id: 'architecture', path: '.guarani/ARCHITECTURE.md',
    label: 'Arquitetura', icon: <FileCode size={14} />,
    description: 'Visão geral do sistema — apps, pacotes, infraestrutura',
    color: '#f59e0b',
  },
  {
    id: 'contributing', path: 'CONTRIBUTING_WITH_AI.md',
    label: 'Guia de Contribuição', icon: <BookOpen size={14} />,
    description: 'Como contribuir usando AI — níveis, regras de PR, setup de IDE',
    color: '#ec4899',
  },
]

function MarkdownRenderer({ content }: { content: string }) {
  // Minimal markdown → HTML: headers, bold, code blocks, links, lists
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBuffer: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} style={{
            padding: '12px 14px', borderRadius: 8, fontSize: 11,
            background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.6)',
            overflow: 'auto', margin: '8px 0', lineHeight: 1.5,
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <code>{codeBuffer.join('\n')}</code>
          </pre>
        )
        codeBuffer = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} style={{ height: 8 }} />)
      continue
    }

    // Headers
    if (line.startsWith('# ')) {
      elements.push(<h2 key={i} style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '16px 0 8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 }}>{formatInline(line.slice(2))}</h2>)
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} style={{ fontSize: 15, fontWeight: 600, color: '#13b6ec', margin: '14px 0 6px' }}>{formatInline(line.slice(3))}</h3>)
      continue
    }
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', margin: '10px 0 4px' }}>{formatInline(line.slice(4))}</h4>)
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />)
      continue
    }

    // Tables
    if (line.includes('|') && line.trim().startsWith('|')) {
      // Collect table rows
      const tableRows: string[] = [line]
      let j = i + 1
      while (j < lines.length && lines[j].includes('|') && lines[j].trim().startsWith('|')) {
        tableRows.push(lines[j])
        j++
      }
      // Skip separator row
      const dataRows = tableRows.filter(r => !r.match(/^\|[\s-:|]+\|$/))
      if (dataRows.length > 0) {
        elements.push(
          <div key={`table-${i}`} style={{ overflow: 'auto', margin: '8px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <tbody>
                {dataRows.map((row, ri) => (
                  <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {row.split('|').filter(c => c.trim()).map((cell, ci) => (
                      ri === 0
                        ? <th key={ci} style={{ padding: '6px 10px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>{formatInline(cell.trim())}</th>
                        : <td key={ci} style={{ padding: '5px 10px', color: 'rgba(255,255,255,0.5)' }}>{formatInline(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        i = j - 1
        continue
      }
    }

    // List items
    if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          <span style={{ color: 'rgba(19,182,236,0.5)', flexShrink: 0 }}>•</span>
          <span>{formatInline(line.replace(/^[-*] /, ''))}</span>
        </div>
      )
      continue
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      const num = line.match(/^(\d+)\./)?.[1]
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0', fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          <span style={{ color: 'rgba(19,182,236,0.5)', flexShrink: 0, fontWeight: 600, fontSize: 11 }}>{num}.</span>
          <span>{formatInline(line.replace(/^\d+\. /, ''))}</span>
        </div>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{
          borderLeft: '3px solid rgba(139,92,246,0.4)', padding: '4px 12px', margin: '6px 0',
          fontSize: 12, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
          background: 'rgba(139,92,246,0.04)',
        }}>
          {formatInline(line.slice(2))}
        </div>
      )
      continue
    }

    // Normal paragraph
    elements.push(
      <p key={i} style={{ margin: '4px 0', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
        {formatInline(line)}
      </p>
    )
  }

  return <>{elements}</>
}

function formatInline(text: string): React.ReactNode {
  // Handle inline code, bold, italic, links
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    // Inline code
    const codeMatch = remaining.match(/^(.*?)`([^`]+)`(.*)$/)
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>)
      parts.push(
        <code key={key++} style={{
          padding: '1px 5px', borderRadius: 3, fontSize: '0.9em',
          background: 'rgba(19,182,236,0.1)', color: '#13b6ec',
          border: '1px solid rgba(19,182,236,0.15)',
        }}>
          {codeMatch[2]}
        </code>
      )
      remaining = codeMatch[3]
      continue
    }

    // Bold
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*(.*)$/)
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>)
      parts.push(<strong key={key++} style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{boldMatch[2]}</strong>)
      remaining = boldMatch[3]
      continue
    }

    // Link
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)(.*)$/)
    if (linkMatch) {
      if (linkMatch[1]) parts.push(<span key={key++}>{linkMatch[1]}</span>)
      parts.push(
        <a key={key++} href={linkMatch[3]} target="_blank" rel="noopener noreferrer"
          style={{ color: '#13b6ec', textDecoration: 'none' }}>
          {linkMatch[2]}
        </a>
      )
      remaining = linkMatch[4]
      continue
    }

    // No more patterns
    parts.push(<span key={key++}>{remaining}</span>)
    break
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export default function SystemPrompts() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, string>>({})
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const loadFile = async (fileId: string) => {
    if (content[fileId]) {
      setSelectedFile(selectedFile === fileId ? null : fileId)
      return
    }

    const file = FILES.find(f => f.id === fileId)
    if (!file) return

    setLoadingFile(fileId)
    setSelectedFile(fileId)

    try {
      const res = await fetch(`/api/github-file?path=${encodeURIComponent(file.path)}`)
      if (res.ok) {
        const data = await res.json()
        setContent(prev => ({ ...prev, [fileId]: data.content }))
      } else {
        setContent(prev => ({ ...prev, [fileId]: '# Erro ao carregar arquivo\n\nNão foi possível carregar este arquivo do GitHub.' }))
      }
    } catch {
      setContent(prev => ({ ...prev, [fileId]: '# Erro de conexão\n\nVerifique sua conexão e tente novamente.' }))
    } finally {
      setLoadingFile(null)
    }
  }

  const copyContent = (fileId: string) => {
    if (content[fileId]) {
      navigator.clipboard.writeText(content[fileId])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
        Estes são os arquivos que governam o comportamento dos agentes AI no EGOS Lab.
        Clique para explorar cada um — você pode copiar e usar no seu projeto.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FILES.map(file => (
          <div key={file.id}>
            <motion.button
              onClick={() => loadFile(file.id)}
              whileHover={{ scale: 1.005 }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                background: selectedFile === file.id
                  ? `linear-gradient(135deg, ${file.color}10, ${file.color}05)`
                  : 'rgba(255,255,255,0.03)',
                border: selectedFile === file.id
                  ? `1px solid ${file.color}30`
                  : '1px solid rgba(255,255,255,0.06)',
                transition: 'all 0.2s', textAlign: 'left',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: `${file.color}15`, color: file.color,
              }}>
                {file.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selectedFile === file.id ? file.color : '#fff' }}>
                  {file.label}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                  {file.description}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  padding: '2px 6px', borderRadius: 4, fontSize: 10,
                  fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.04)',
                }}>
                  {file.path}
                </span>
                <ChevronRight size={14} style={{
                  color: 'rgba(255,255,255,0.25)',
                  transform: selectedFile === file.id ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />
              </div>
            </motion.button>

            <AnimatePresence>
              {selectedFile === file.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{
                    margin: '4px 0 8px', padding: '16px 20px', borderRadius: '0 0 10px 10px',
                    background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)',
                    borderTop: 'none', maxHeight: 500, overflowY: 'auto',
                  }}>
                    {loadingFile === file.id ? (
                      <div style={{ padding: 20, textAlign: 'center' }}>
                        <div style={{ width: 24, height: 24, border: '2px solid rgba(19,182,236,0.3)', borderTop: '2px solid #13b6ec', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>Carregando do GitHub...</p>
                      </div>
                    ) : content[file.id] ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 8 }}>
                          <button
                            onClick={() => copyContent(file.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                              borderRadius: 4, fontSize: 10, cursor: 'pointer',
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            {copied ? <Check size={10} /> : <Copy size={10} />}
                            {copied ? 'Copiado!' : 'Copiar'}
                          </button>
                          <a
                            href={`https://github.com/enioxt/egos-lab/blob/main/${file.path}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
                              borderRadius: 4, fontSize: 10, textDecoration: 'none',
                              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                              border: '1px solid rgba(255,255,255,0.08)',
                            }}
                          >
                            <ExternalLink size={10} /> GitHub
                          </a>
                        </div>
                        <MarkdownRenderer content={content[file.id]} />
                      </>
                    ) : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  )
}
