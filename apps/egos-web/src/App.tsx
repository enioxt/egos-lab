import { lazy, Suspense } from 'react'
import { Network, Bot, GitCommit, MessageCircle, Lightbulb, Shield, Lock, Search } from 'lucide-react'
import HeroSection from './components/HeroSection'
import EcosystemGrid from './components/EcosystemGrid'
import CollapsibleSection from './components/CollapsibleSection'
import NetworkBackground from './components/NetworkBackground'
import Footer from './components/Footer'
import { useAuth } from './hooks/useAuth'
import './App.css'

const UserWorkspace = lazy(() => import('./components/UserWorkspace'))
const SystemPrompts = lazy(() => import('./components/SystemPrompts'))
const IntelligenceChat = lazy(() => import('./components/IntelligenceChat'))
const ActivityStream = lazy(() => import('./components/ActivityStream'))
const IdeasCatalog = lazy(() => import('./components/IdeasCatalog'))
const ListeningSpiral = lazy(() => import('./components/ListeningSpiral'))
const SecurityHub = lazy(() => import('./components/SecurityHub'))
const AuditHub = lazy(() => import('./components/AuditHub'))

function SectionLoader() {
  return <div className="section-loader"><div className="loader-pulse" /></div>
}

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <NetworkBackground />
      <HeroSection />

      {isAuthenticated && (
        <Suspense fallback={<SectionLoader />}>
          <UserWorkspace />
        </Suspense>
      )}

      <CollapsibleSection
        id="ecosystem"
        icon={<Network size={18} />}
        title="Ecossistema"
        subtitle="Módulos do ecossistema — do estável ao experimental"
        badge="10 módulos"
        badgeColor="#10b981"
        defaultOpen={true}
      >
        <EcosystemGrid />
      </CollapsibleSection>

      <CollapsibleSection
        id="audit-hub"
        icon={<Search size={18} />}
        title="Audit Hub"
        subtitle="Cole a URL do seu GitHub e receba análise completa de 14 agentes"
        badge="BETA"
        badgeColor="#3b82f6"
        defaultOpen={true}
      >
        <Suspense fallback={<SectionLoader />}>
          <AuditHub />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="system-prompts"
        icon={<Shield size={18} />}
        title="Guardrails & System Prompts"
        subtitle="As regras que governam os agentes AI — explore e copie"
        badge="5 arquivos"
        badgeColor="#8b5cf6"
      >
        <Suspense fallback={<SectionLoader />}>
          <SystemPrompts />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="security-hub"
        icon={<Lock size={18} />}
        title="Security Hub"
        subtitle="Tools, shared rules, and AI-powered improvement insights"
        badge="Community"
        badgeColor="#f59e0b"
      >
        <Suspense fallback={<SectionLoader />}>
          <SecurityHub />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="intelligence"
        icon={<Bot size={18} />}
        title="EGOS Intelligence"
        subtitle="Converse com a IA do ecossistema"
        badge="AI"
        badgeColor="#13b6ec"
      >
        <Suspense fallback={<SectionLoader />}>
          <IntelligenceChat />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="activity"
        icon={<GitCommit size={18} />}
        title="Atividade Recente"
        subtitle="Commits, deploys e mudanças em tempo real"
        badge="LIVE"
        badgeColor="#22c55e"
      >
        <Suspense fallback={<SectionLoader />}>
          <ActivityStream />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="spiral"
        icon={<MessageCircle size={18} />}
        title="Espiral de Escuta"
        subtitle="Cada commit é uma mensagem — builders colaborando"
      >
        <Suspense fallback={<SectionLoader />}>
          <ListeningSpiral />
        </Suspense>
      </CollapsibleSection>

      <CollapsibleSection
        id="ideas"
        icon={<Lightbulb size={18} />}
        title="Central de Ideias & MVPs"
        subtitle="Projetos, protótipos e oportunidades abertas"
        badge="14 itens"
        badgeColor="#a855f7"
      >
        <Suspense fallback={<SectionLoader />}>
          <IdeasCatalog />
        </Suspense>
      </CollapsibleSection>

      <Footer />
    </div>
  )
}

export default App
