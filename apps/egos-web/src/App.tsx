import { lazy, Suspense } from 'react'
import { Network, Bot, GitCommit, MessageCircle, Lightbulb } from 'lucide-react'
import HeroSection from './components/HeroSection'
import EcosystemGrid from './components/EcosystemGrid'
import CollapsibleSection from './components/CollapsibleSection'
import NetworkBackground from './components/NetworkBackground'
import { useAuth } from './hooks/useAuth'
import './App.css'

const UserWorkspace = lazy(() => import('./components/UserWorkspace'))
const IntelligenceChat = lazy(() => import('./components/IntelligenceChat'))
const ActivityStream = lazy(() => import('./components/ActivityStream'))
const IdeasCatalog = lazy(() => import('./components/IdeasCatalog'))
const ListeningSpiral = lazy(() => import('./components/ListeningSpiral'))

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
    </div>
  )
}

export default App
