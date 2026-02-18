import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, Brain, Radio, ShoppingCart, Bot,
  Globe, Shield, Scale, TrendingUp, Users, Zap, X,
  ExternalLink, GitBranch, ArrowUpRight, Layers, Target
} from 'lucide-react';

type Status = 'live' | 'functional' | 'prototype' | 'idea' | 'paused';

interface ProjectItem {
  id: string;
  name: string;
  description: string;
  details: string;
  icon: React.ElementType;
  status: Status;
  category: 'mvp' | 'agent' | 'idea' | 'opportunity';
  techStack?: string[];
  metrics?: string;
  githubPath?: string;
  participationCta?: string;
}

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  live: { label: 'LIVE', color: '#22c55e', bg: '#22c55e15' },
  functional: { label: 'Funcional', color: '#3b82f6', bg: '#3b82f615' },
  prototype: { label: 'Protótipo', color: '#f59e0b', bg: '#f59e0b15' },
  idea: { label: 'Ideia', color: '#a855f7', bg: '#a855f715' },
  paused: { label: 'Pausado', color: '#64748b', bg: '#64748b15' },
};

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  mvp: { label: 'MVP', color: '#22c55e' },
  agent: { label: 'Agente', color: '#3b82f6' },
  idea: { label: 'Ideia', color: '#a855f7' },
  opportunity: { label: 'Oportunidade', color: '#f59e0b' },
};

const ALL_ITEMS: ProjectItem[] = [
  // ═══ MVPs ═══
  {
    id: 'egos-web',
    name: 'EGOS Web',
    description: 'Mission Control — dashboard do ecossistema com IA, atividade e chat público.',
    details: 'Site principal em egos.ia.br. React + Vite, deploy automático no Vercel. Activity stream com modais interativos, filtros por categoria, AI insights. Chat público com Gemini 2.0 Flash alimentado por SSOT (fonte única de verdade). Rate limiting 10 req/min.',
    icon: Globe,
    status: 'live',
    category: 'mvp',
    techStack: ['React', 'Vite', 'Zustand', 'Supabase', 'Vercel'],
    metrics: 'Live em egos.ia.br, 10+ seções, chat IA público',
    githubPath: 'apps/egos-web',
  },
  {
    id: 'intelink',
    name: 'Intelink',
    description: 'Plataforma de inteligência policial — investigações, entidades, vínculos, documentos.',
    details: 'Sistema completo para DHPP: resolução de entidades, análise cross-case, extração de documentos com IA, gestão de evidências, 15+ modais interativos, controle de permissões, auditoria. PII masking nativo. 20+ API routes, Playwright E2E.',
    icon: Brain,
    status: 'functional',
    category: 'mvp',
    techStack: ['Next.js 15', 'Supabase', 'OpenRouter', 'Tailwind'],
    metrics: '15+ modais, 20+ APIs, PII masking, Playwright tests',
    githubPath: 'apps/intelink',
  },
  {
    id: 'eagle-eye',
    name: 'Eagle Eye',
    description: 'Monitor OSINT de Diários Oficiais — 17 padrões de oportunidades detectados automaticamente.',
    details: 'Scraper de diários oficiais brasileiros via API Querido Diário. 17 padrões de detecção: Licitações, Zoneamento, Carreiras Policiais, Controle Fiscal, LGPD, Registro de Marca (INPI), Food Business, Automotivo, Agronegócio, Anti-Fraude Crypto, Turismo, Moderação de Conteúdo, IA/ML, Jornalismo, Estoque, E-commerce, Incentivos para Startups. Análise de viabilidade com IA.',
    icon: Eye,
    status: 'functional',
    category: 'mvp',
    techStack: ['Bun', 'TypeScript', 'Querido Diário API', 'OpenRouter'],
    metrics: '17 padrões, 3 estratégias de detecção, análise IA',
    githubPath: 'apps/eagle-eye',
    participationCta: 'Ajude a adicionar novos padrões de detecção!',
  },
  {
    id: 'marketplace-core',
    name: 'Marketplace Core',
    description: 'Domain modeling — máquina de estados, ledger de pagamentos, identidade.',
    details: 'Modelagem de domínio para marketplaces: state machine para transações, payment ledger com double-entry, identity management. Patterns reutilizáveis para qualquer marketplace. Testes unitários com Vitest.',
    icon: ShoppingCart,
    status: 'prototype',
    category: 'mvp',
    techStack: ['TypeScript', 'Vitest'],
    metrics: 'State machine + ledger testados',
    githubPath: 'apps/marketplace-core',
    participationCta: 'Ajude a implementar o sistema de disputas!',
  },
  {
    id: 'radio-philein',
    name: 'Radio Philein',
    description: 'Rádio comunitária — conceito de streaming de áudio com participação coletiva.',
    details: 'Conceito de rádio comunitária digital com curadoria por IA. Playlists colaborativas, transmissão ao vivo, integração com eventos do ecossistema. Inspirado em rádios piratas brasileiras e community radio movement.',
    icon: Radio,
    status: 'paused',
    category: 'mvp',
    techStack: ['Next.js', 'Web Audio API'],
    githubPath: 'apps/radio-philein',
    participationCta: 'Quer reativar este projeto? Abra uma issue!',
  },

  // ═══ Agentic Platform ═══
  {
    id: 'agentic-platform',
    name: 'Plataforma de Agentes',
    description: '11 agentes autônomos + orchestrador — auditam, protegem e evoluem codebases em ~6s.',
    details: 'SSOT Auditor, Security Scanner, Auth Checker, Cortex Reviewer, Dep Auditor, Dead Code Detector, Idea Scanner, Rho Calculator, Knowledge Disseminator, UI Designer, E2E Smoke. Orchestrador roda todos e gera relatório combinado. 4 case studies: Documenso (1012), Cal.com (1469), tRPC (388), Medusa (2427 findings). Zero dependências externas, roda em qualquer projeto TS.',
    icon: Bot,
    status: 'live',
    category: 'agent',
    techStack: ['Bun', 'TypeScript', 'JSONL', 'OpenRouter'],
    metrics: '11 agentes, 4 case studies, 100% health, 6.1s total',
    githubPath: 'agents',
    participationCta: 'Crie seu próprio agente! Veja docs/agentic/how-to.md',
  },

  // ═══ Ideas (Open for Collaboration) ═══
  {
    id: 'builder-hub',
    name: 'GitHub-First Builder Hub',
    description: 'Plataforma de projetos, help requests e LegalLab — onboarding de builders.',
    details: 'Importar projetos via GitHub URL, runbook estruturado (como rodar, env, custos), help requests com context/logs/reproduction, LegalLab com microtasks (do zero ao "alguém rodou meu projeto"). Reputação por utilidade.',
    icon: GitBranch,
    status: 'idea',
    category: 'idea',
    participationCta: 'Ajude a definir o MVP! Veja docs/EGOSWEB_PRODUCT_VISION.md',
  },
  {
    id: 'listening-spiral',
    name: 'Espiral de Escuta',
    description: 'Chat colaborativo onde ações (commits, pushes) são a linguagem de participação.',
    details: 'As pessoas conversam com o sistema através de ações reais: commits, pushes, issues. Cada ação é identificada por quem a fez (via GitHub). Camadas de IA geram insights sobre cada interação. A espiral cresce com mais participantes.',
    icon: Zap,
    status: 'idea',
    category: 'idea',
    participationCta: 'Faça um commit e participe da espiral!',
  },
  {
    id: 'rule-marketplace',
    name: 'Rule Marketplace',
    description: 'Marketplace de regras compartilháveis para codebases — .windsurfrules, agents, skills.',
    details: 'Compartilhe e descubra rule packs para codebases. Upload/download de .windsurfrules, agents, skills, workflows. Avaliação por comunidade, reputação de criadores.',
    icon: Layers,
    status: 'idea',
    category: 'idea',
    participationCta: 'Compartilhe suas regras!',
  },
  {
    id: 'agent-marketplace',
    name: 'Agent Marketplace',
    description: 'Agentes criados pela comunidade — instale, rode, avalie.',
    details: 'Extensão da plataforma de agentes para a comunidade. Qualquer pessoa pode criar, publicar e compartilhar agentes. Sistema de avaliação, métricas de uso, rankings.',
    icon: Bot,
    status: 'idea',
    category: 'idea',
    participationCta: 'Crie um agente e publique!',
  },
  {
    id: 'cloud-legal',
    name: 'Cloud Legal',
    description: 'Automação de compliance legal — LGPD, regulamentações, prazos.',
    details: 'Monitora automaticamente novas obrigações legais publicadas em diários oficiais. Alerta sobre prazos de adequação, multas, sanções. Integra com Eagle Eye para detecção.',
    icon: Scale,
    status: 'idea',
    category: 'idea',
    participationCta: 'Conhece direito? Ajude a modelar as regras!',
  },
  {
    id: 'anti-fraud-crypto',
    name: 'Anti-Fraude Crypto',
    description: 'Detecção de padrões de fraude em blockchain — lavagem, phishing, rug pulls.',
    details: 'Análise de transações blockchain para detectar padrões de fraude: lavagem de dinheiro via mixing, phishing campaigns, rug pull patterns. Integra com dados públicos para cross-reference.',
    icon: Shield,
    status: 'idea',
    category: 'idea',
    participationCta: 'Trabalha com blockchain? Ajude a definir os padrões!',
  },
  {
    id: 'reputation-system',
    name: 'Sistema de Reputação',
    description: 'Reputação por utilidade — soluções aceitas, projetos que rodam, ajuda dada.',
    details: 'Não é karma vazio. Reputação baseada em ações mensuráveis: quantas pessoas conseguiram rodar seu projeto, quantas soluções suas foram aceitas, quanto ajudou outros builders.',
    icon: TrendingUp,
    status: 'idea',
    category: 'idea',
    participationCta: 'Ajude a definir as métricas de reputação!',
  },

  // ═══ Eagle Eye Opportunities ═══
  {
    id: 'pncp-integration',
    name: 'Integração PNCP',
    description: 'Cross-reference de licitações com Portal Nacional de Contratações Públicas.',
    details: 'O Eagle Eye detecta licitações nos Diários Oficiais. Com a integração PNCP, podemos cruzar com dados do portal nacional para análise mais completa: valores, histórico de fornecedores, padrões de contratação.',
    icon: Target,
    status: 'idea',
    category: 'opportunity',
    participationCta: 'Conhece a API do PNCP? Ajude a integrar!',
  },
  {
    id: 'gazette-opportunities',
    name: '17 Padrões de Oportunidades',
    description: 'Oportunidades reais encontradas pelo Eagle Eye em Diários Oficiais brasileiros.',
    details: 'O Eagle Eye já detecta 17 tipos: Licitações (pregões, tomadas de preço), Zoneamento (mudanças urbanas), Carreiras (concursos, nomeações), Fiscal (créditos suplementares), LGPD (prazos), INPI (marcas), Food (regulamentações), Automotivo, Agro (laudos), Anti-Fraude, Turismo, Conteúdo, IA/ML, Jornalismo, Estoque, E-commerce, Startups.',
    icon: Eye,
    status: 'functional',
    category: 'opportunity',
    metrics: '17 padrões, 3 estratégias de detecção',
    participationCta: 'Sugira novos padrões de detecção!',
  },
];

/* ── Detail Modal ── */
const DetailModal: React.FC<{ item: ProjectItem; onClose: () => void }> = ({ item, onClose }) => {
  const statusCfg = STATUS_CONFIG[item.status];
  const catCfg = CATEGORY_CONFIG[item.category];
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', maxWidth: '560px', width: '100%',
          maxHeight: '80vh', overflow: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `${catCfg.color}12`, border: `1px solid ${catCfg.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: catCfg.color,
            }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>{item.name}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '4px',
                  background: statusCfg.bg, color: statusCfg.color,
                  border: `1px solid ${statusCfg.color}30`,
                }}>{statusCfg.label}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                  padding: '2px 8px', borderRadius: '4px',
                  background: `${catCfg.color}12`, color: catCfg.color,
                  border: `1px solid ${catCfg.color}30`,
                }}>{catCfg.label}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px',
            padding: '6px', cursor: 'pointer', color: 'rgba(255,255,255,0.5)',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
            {item.details}
          </p>

          {item.metrics && (
            <div style={{
              padding: '10px 14px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.6)',
            }}>
              <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Métricas:</strong> {item.metrics}
            </div>
          )}

          {item.techStack && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              {item.techStack.map(t => (
                <span key={t} style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                  background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>{t}</span>
              ))}
            </div>
          )}

          {item.participationCta && (
            <div style={{
              padding: '12px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(19,182,236,0.08))',
              border: '1px solid rgba(168,85,247,0.15)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px',
                fontSize: '10px', fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: '#a855f7',
              }}>
                <Users size={10} /> Participe
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                {item.participationCta}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{
          padding: '12px 20px 16px', display: 'flex', gap: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {item.githubPath && (
            <a href={`https://github.com/enioxt/egos-lab/tree/main/${item.githubPath}`}
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '6px', padding: '8px', borderRadius: '8px', fontSize: '12px',
                fontWeight: 500, textDecoration: 'none',
                background: 'rgba(19,182,236,0.12)', color: '#13b6ec',
              }}>
              <ArrowUpRight size={14} /> Ver no GitHub
            </a>
          )}
          {item.status === 'idea' && (
            <a href="https://github.com/enioxt/egos-lab/issues"
              target="_blank" rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '6px', padding: '8px', borderRadius: '8px', fontSize: '12px',
                fontWeight: 500, textDecoration: 'none',
                background: 'rgba(168,85,247,0.12)', color: '#a855f7',
              }}>
              <ExternalLink size={14} /> Quero Ajudar
            </a>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Main Component ── */
const IdeasCatalog: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<ProjectItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? ALL_ITEMS.filter(i => i.category === activeCategory)
    : ALL_ITEMS;

  const counts: Record<string, number> = {};
  ALL_ITEMS.forEach(i => { counts[i.category] = (counts[i.category] || 0) + 1; });

  return (
    <section id="ideas" style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: '28px', fontWeight: 700, marginBottom: '8px',
          background: 'linear-gradient(135deg, #a855f7, #13b6ec)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Central de Ideias & MVPs
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto' }}>
          Ideias são apenas ideias — elas viram planos quando mais pessoas se juntam para construir.
        </p>
      </motion.div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveCategory(null)}
          style={{
            padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
            border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
            borderColor: !activeCategory ? 'rgba(19,182,236,0.4)' : 'rgba(255,255,255,0.08)',
            background: !activeCategory ? 'rgba(19,182,236,0.1)' : 'transparent',
            color: !activeCategory ? '#13b6ec' : 'rgba(255,255,255,0.5)',
          }}
        >
          Todos ({ALL_ITEMS.length})
        </button>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(activeCategory === key ? null : key)}
            style={{
              padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
              border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
              borderColor: activeCategory === key ? `${cfg.color}60` : 'rgba(255,255,255,0.08)',
              background: activeCategory === key ? `${cfg.color}15` : 'transparent',
              color: activeCategory === key ? cfg.color : 'rgba(255,255,255,0.4)',
            }}
          >
            {cfg.label} ({counts[key] || 0})
          </button>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '12px',
      }}>
        {filtered.map((item, i) => {
          const statusCfg = STATUS_CONFIG[item.status];
          const Icon = item.icon;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedItem(item)}
              style={{
                padding: '16px', borderRadius: '12px', cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.15)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Icon size={18} style={{ color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{item.name}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: '9px', fontWeight: 600,
                  textTransform: 'uppercase', padding: '2px 6px', borderRadius: '4px',
                  background: statusCfg.bg, color: statusCfg.color,
                  border: `1px solid ${statusCfg.color}30`,
                }}>{statusCfg.label}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
                {item.description}
              </p>
              {item.participationCta && (
                <div style={{
                  marginTop: '10px', fontSize: '11px', color: '#a855f7',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  <Users size={11} /> Aberto para participação
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </section>
  );
};

export default IdeasCatalog;
