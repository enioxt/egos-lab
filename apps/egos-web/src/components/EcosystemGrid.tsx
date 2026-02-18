import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Brain, Eye, Radio, Smartphone, Sparkles,
  Network, Globe, ChevronDown, ExternalLink, X
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
  },
  {
    id: 'agentic-platform',
    name: 'Agentic Platform',
    icon: <Network size={20} />,
    status: 'beta',
    statusLabel: 'Beta',
    completion: 60,
    description: '10 agentes autônomos com orchestrador: SSOT Auditor, Auth Checker, Code Reviewer, Dep Auditor, Dead Code Detector.',
    details: '10 agentes registrados + orchestrador (100% health, 3.8s). Runtime próprio, CLI, logs JSONL, dry-run/execute. 4 case studies reais: Documenso (1012), Cal.com (1469), tRPC (388), Medusa (2427 findings). Zero-dependency.',
    techStack: ['Bun', 'TypeScript', 'OpenRouter', 'JSONL'],
    category: 'infra',
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

const ModuleDetail: React.FC<{ mod: Module; onClose: () => void }> = ({ mod, onClose }) => (
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
        <h3>{mod.name}</h3>
        <span className="detail-status" style={{ color: STATUS_COLORS[mod.status] }}>
          {mod.statusLabel} · {mod.completion}% completo
        </span>
      </div>
      <button className="detail-close" onClick={onClose}><X size={16} /></button>
    </div>
    <p className="detail-text">{mod.details}</p>
    <div className="detail-tech">
      {mod.techStack.map(t => (
        <span key={t} className="tech-tag">{t}</span>
      ))}
    </div>
    {mod.link && (
      <a href={mod.link} target="_blank" rel="noopener noreferrer" className="detail-link">
        <ExternalLink size={12} /> Acessar {mod.name}
      </a>
    )}
  </motion.div>
);

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
