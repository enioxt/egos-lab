import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Brain, Eye, Radio, Smartphone, Sparkles,
  Network, Globe, ChevronDown, ExternalLink, X,
  FileCode, FolderTree, Zap, BookOpen, Github
} from 'lucide-react';

interface Module {
  id: string;
  name: string;
  icon: React.ReactNode;
  status: 'stable' | 'beta' | 'alpha' | 'concept';
  statusLabel: string;
  completion: number;
  description: string;
  details: string;
  techStack: string[];
  category: 'infra' | 'core' | 'research';
  link?: string;
  keyFiles?: string[];
  insights?: string[];
  actions?: { label: string; url: string }[];
}

const MODULES: Module[] = [
  // Infrastructure
  {
    id: 'security-protocol',
    name: 'Security Protocol',
    icon: <Shield size={20} />,
    status: 'stable',
    statusLabel: 'Stable',
    completion: 100,
    description: 'Scanner pré-commit com entropia e heurística. Proteção ativa contra vazamento de segredos.',
    details: 'ESP-01: Paranoid Security Scan com análise de entropia Shannon, detecção de padrões de API keys, e bloqueio automático de commits inseguros. Integrado via Husky pre-commit hooks.',
    techStack: ['TypeScript', 'Husky', 'Shannon Entropy'],
    category: 'infra',
    keyFiles: ['scripts/security_scan.ts', '.husky/pre-commit', 'scripts/ssot_governance.ts'],
    insights: ['Bloqueia commits com secrets detectados automaticamente', '12 checks automáticos no pre-commit (5 blocking, 7 warning)', 'Análise de entropia Shannon identifica strings com alta aleatoriedade (possíveis API keys)'],
    actions: [{ label: 'Ver Script no GitHub', url: 'https://github.com/enioxt/egos-lab/blob/main/scripts/security_scan.ts' }],
  },
  {
    id: 'guarani-protocol',
    name: 'Guarani Protocol',
    icon: <Globe size={20} />,
    status: 'stable',
    statusLabel: 'Stable',
    completion: 100,
    description: 'Governança e identidade para agentes AI. O "sistema operacional" das regras.',
    details: 'Framework de governança que define identidade (.guarani/IDENTITY.md), preferências de código (.guarani/PREFERENCES.md), e regras de agente (.windsurfrules). Garante consistência entre sessões e agentes.',
    techStack: ['Markdown', 'YAML', 'MCP'],
    category: 'infra',
    keyFiles: ['.guarani/IDENTITY.md', '.guarani/PREFERENCES.md', '.windsurfrules', '.guarani/ARCHITECTURE.md'],
    insights: ['Compatível com Windsurf, Cursor, Claude Code e VS Code', 'Define regras que agentes AI seguem automaticamente ao abrir o projeto', 'Separa identidade (quem), preferências (como) e arquitetura (onde)'],
    actions: [
      { label: 'Ver .guarani/', url: 'https://github.com/enioxt/egos-lab/tree/main/.guarani' },
      { label: 'Copiar para seu projeto', url: 'https://github.com/enioxt/egos-lab/tree/main/.guarani' },
    ],
  },
  {
    id: 'agentic-platform',
    name: 'Agentic Platform',
    icon: <Network size={20} />,
    status: 'beta',
    statusLabel: 'Beta',
    completion: 60,
    description: '15 agentes autônomos com orchestrador: SSOT Auditor, Auth Checker, Code Reviewer, UI Designer, Contract Tester, Integration Tester, Regression Watcher, AI Verifier e mais.',
    details: '15 agentes registrados + orchestrador (100% health). 5-layer testing: static analysis → contract → integration → regression → AI verification. Regression Watcher detecta regressões e testes flaky. AI Verifier testa o chatbot com ataques adversariais. 4 case studies reais. Zero-dependency.',
    techStack: ['Bun', 'TypeScript', 'OpenRouter', 'JSONL'],
    category: 'infra',
    keyFiles: ['agents/cli.ts', 'agents/runtime/runner.ts', 'agents/registry/agents.json', 'agents/agents/'],
    insights: ['Cada agente roda em <1s, total orquestrado em ~7s', '5 camadas de teste: Static → Contract → Integration → Regression → AI', 'AI Verifier: 9/9 testes, score médio 9.9/10 contra prompt injection'],
    actions: [
      { label: 'Ver Agentes', url: 'https://github.com/enioxt/egos-lab/tree/main/agents' },
      { label: 'Docs: Como Criar Agente', url: 'https://github.com/enioxt/egos-lab/blob/main/docs/agentic/how-to.md' },
    ],
  },
  // Core Systems
  {
    id: 'intelink',
    name: 'Intelink Core',
    icon: <Brain size={20} />,
    status: 'beta',
    statusLabel: 'Beta',
    completion: 80,
    description: 'O orquestrador central de inteligência. O "cérebro" que conecta todos os agentes.',
    details: 'Central Intelligence Unit que coordena agentes autônomos, gerencia contexto entre sessões, e orquestra fluxos de trabalho complexos. Implementação Next.js 16 com Turbopack.',
    techStack: ['Next.js', 'Supabase', 'MCP', 'Zustand'],
    category: 'core',
    link: 'https://intelink.ia.br',
  },
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    icon: <Eye size={20} />,
    status: 'alpha',
    statusLabel: 'Alpha',
    completion: 40,
    description: 'Monitor de diários oficiais com IA. Detecta oportunidades em licitações e legislação.',
    details: 'Scraper inteligente que monitora o Querido Diário API, analisa textos legais via OpenRouter/Gemini, e classifica 17 padrões de oportunidade (licitações, zoneamento, LGPD, etc). Já detectou oportunidades reais em BH.',
    techStack: ['Bun', 'OpenRouter', 'Querido Diário API'],
    category: 'core',
  },
  {
    id: 'egos-web',
    name: 'Mission Control',
    icon: <Sparkles size={20} />,
    status: 'beta',
    statusLabel: 'Beta',
    completion: 60,
    description: 'Este site. O portal interativo para explorar e interagir com o ecossistema EGOS.',
    details: 'Interface Mission Control com visualização do ecossistema, chat RAG-powered com inteligência de commits, e activity stream. Construído com Vite + React + Framer Motion.',
    techStack: ['Vite', 'React', 'Zustand', 'Supabase'],
    category: 'core',
  },
  // Research
  {
    id: 'radio-philein',
    name: 'Radio Philein',
    icon: <Radio size={20} />,
    status: 'alpha',
    statusLabel: 'Alpha',
    completion: 30,
    description: 'Marketplace conceitual. "The Vibe" — conectando criadores a oportunidades.',
    details: 'Conceito de marketplace descentralizado onde criadores podem oferecer serviços e produtos, com comissão transparente e gamificação via $ETHIK tokens.',
    techStack: ['React', 'Supabase'],
    category: 'research',
  },
  {
    id: 'psycho-engine',
    name: 'Psycho Engine',
    icon: <Sparkles size={20} />,
    status: 'concept',
    statusLabel: 'Concept',
    completion: 10,
    description: 'Motor de detecção de padrões psicológicos. 12 arquétipos via análise de linguagem.',
    details: 'Framework de análise de linguagem natural que detecta 12 padrões psicológicos (Resistência, Projeção, Racionalização, etc.) usando LLMs. Inclui sistema de worksheets terapêuticos personalizados.',
    techStack: ['LLM', 'Prompt Engineering'],
    category: 'research',
  },
  {
    id: 'mycelium',
    name: 'Mycelium Network',
    icon: <Network size={20} />,
    status: 'concept',
    statusLabel: 'Concept',
    completion: 5,
    description: 'Rede de interconexão entre agentes via NATS + ZKP. A "internet" dos agentes.',
    details: 'Camada de comunicação descentralizada entre agentes autônomos usando NATS messaging e Zero-Knowledge Proofs para identidade privada. Apenas especificação por enquanto.',
    techStack: ['NATS', 'ZKP', 'snarkjs'],
    category: 'research',
  },
  {
    id: 'cortex-mobile',
    name: 'Cortex Mobile',
    icon: <Smartphone size={20} />,
    status: 'alpha',
    statusLabel: 'Alpha',
    completion: 30,
    description: 'Serviço de acessibilidade Android para captura de contexto em tempo real.',
    details: 'App Android que usa o Accessibility Service para capturar contexto do dispositivo (apps abertos, notificações, conteúdo na tela) e alimentar o Intelink com dados do mundo real.',
    techStack: ['Kotlin', 'Android', 'Accessibility API'],
    category: 'research',
  },
];

const CATEGORIES = [
  { key: 'infra', label: 'Infraestrutura', sublabel: 'Estável & Validado', color: '#10b981' },
  { key: 'core', label: 'Sistemas Core', sublabel: 'Em Desenvolvimento', color: '#13b6ec' },
  { key: 'research', label: 'Laboratório', sublabel: 'Pesquisa & Conceito', color: '#a855f7' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  stable: '#10b981',
  beta: '#f59e0b',
  alpha: '#ef4444',
  concept: '#6b7280',
};

const ModuleCard: React.FC<{ mod: Module; onClick: () => void }> = ({ mod, onClick }) => (
  <motion.div
    className="module-card"
    onClick={onClick}
    whileHover={{ y: -2, scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
    layout
  >
    <div className="module-icon" style={{ color: STATUS_COLORS[mod.status] }}>
      {mod.icon}
    </div>
    <div className="module-info">
      <h3 className="module-name">{mod.name}</h3>
      <p className="module-desc">{mod.description}</p>
    </div>
    <div className="module-right">
      <span className="module-status" style={{ background: `${STATUS_COLORS[mod.status]}20`, color: STATUS_COLORS[mod.status] }}>
        {mod.statusLabel}
      </span>
      <div className="module-progress-bar">
        <div className="module-progress-fill" style={{ width: `${mod.completion}%`, background: STATUS_COLORS[mod.status] }} />
      </div>
    </div>
    <ChevronDown size={14} className="module-chevron" />
  </motion.div>
);

const TechTagDetail: React.FC<{ tech: string; repoBase: string }> = ({ tech, repoBase }) => {
  const [expanded, setExpanded] = useState(false);
  const searchUrl = `${repoBase}/search?q=${encodeURIComponent(tech)}&type=code`;
  return (
    <span
      className="tech-tag"
      onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
      style={{ cursor: 'pointer', position: 'relative' }}
      title={`Clique para ver uso de ${tech} no repositório`}
    >
      {tech}
      {expanded && (
        <span style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 4,
          padding: '8px 12px', borderRadius: 8, minWidth: 220, zIndex: 10,
          background: 'rgba(5,5,8,0.95)', border: '1px solid rgba(19,182,236,0.2)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#13b6ec', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {tech}
          </span>
          <a href={searchUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Github size={10} /> Buscar no repositório
          </a>
        </span>
      )}
    </span>
  );
};

const ModuleDetail: React.FC<{ mod: Module; onClose: () => void }> = ({ mod, onClose }) => {
  const repoBase = 'https://github.com/enioxt/egos-lab';
  return (
    <motion.div
      className="module-detail"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="detail-header">
        <div className="detail-icon" style={{ color: STATUS_COLORS[mod.status] }}>{mod.icon}</div>
        <div>
          <span className="detail-status" style={{ color: STATUS_COLORS[mod.status] }}>
            {mod.statusLabel} · {mod.completion}% completo
          </span>
        </div>
        <button className="detail-close" onClick={onClose}><X size={16} /></button>
      </div>

      <p className="detail-text">{mod.details}</p>

      {/* Insights */}
      {mod.insights && mod.insights.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <Zap size={11} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Insights</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {mod.insights.map((ins, i) => (
              <div key={i} style={{
                padding: '6px 10px', borderRadius: 6,
                background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.1)',
                fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
              }}>
                {ins}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Files */}
      {mod.keyFiles && mod.keyFiles.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            <FileCode size={11} style={{ color: '#a78bfa' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arquivos Principais</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {mod.keyFiles.map(f => (
              <a
                key={f}
                href={`${repoBase}/blob/main/${f}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  padding: '3px 8px', borderRadius: 4,
                  background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)',
                  fontSize: 10, fontFamily: 'monospace', color: '#a78bfa',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <FolderTree size={8} /> {f}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tech Stack — clickable tags */}
      <div className="detail-tech">
        {mod.techStack.map(t => (
          <TechTagDetail key={t} tech={t} repoBase={repoBase} />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {mod.link && (
          <a href={mod.link} target="_blank" rel="noopener noreferrer" className="detail-link" onClick={e => e.stopPropagation()}>
            <ExternalLink size={12} /> Acessar {mod.name}
          </a>
        )}
        {mod.actions?.map(a => (
          <a key={a.label} href={a.url} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 12px', borderRadius: 6,
              background: 'rgba(19,182,236,0.08)', border: '1px solid rgba(19,182,236,0.15)',
              color: '#13b6ec', fontSize: 11, fontWeight: 600, textDecoration: 'none',
            }}
          >
            <BookOpen size={10} /> {a.label}
          </a>
        ))}
      </div>
    </motion.div>
  );
};

const EcosystemGrid: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section id="ecosystem" className="ecosystem">
      <motion.div
        className="section-intro"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="section-title">Espirais de Escuta</h2>
        <p className="section-desc">
          Cada módulo é uma espiral que escuta, analisa e age sobre dados específicos.
          Explore por categoria — do estável ao experimental.
        </p>
      </motion.div>

      {CATEGORIES.map(cat => {
        const mods = MODULES.filter(m => m.category === cat.key);
        return (
          <div key={cat.key} className="category-group">
            <div className="category-header">
              <span className="category-dot" style={{ background: cat.color }} />
              <div>
                <h3 className="category-label">{cat.label}</h3>
                <span className="category-sublabel">{cat.sublabel}</span>
              </div>
              <span className="category-count">{mods.length}</span>
            </div>
            <div className="modules-list">
              {mods.map(mod => (
                <React.Fragment key={mod.id}>
                  <ModuleCard
                    mod={mod}
                    onClick={() => setExpandedId(expandedId === mod.id ? null : mod.id)}
                  />
                  <AnimatePresence>
                    {expandedId === mod.id && (
                      <ModuleDetail mod={mod} onClose={() => setExpandedId(null)} />
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
};

export default EcosystemGrid;
