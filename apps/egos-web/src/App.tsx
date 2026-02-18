import { lazy, Suspense } from 'react'
import HeroSection from './components/HeroSection'
import EcosystemGrid from './components/EcosystemGrid'
import './App.css'

const IntelligenceChat = lazy(() => import('./components/IntelligenceChat'))
const ActivityStream = lazy(() => import('./components/ActivityStream'))
const IdeasCatalog = lazy(() => import('./components/IdeasCatalog'))
const ListeningSpiral = lazy(() => import('./components/ListeningSpiral'))

function SectionLoader() {
  return <div className="section-loader"><div className="loader-pulse" /></div>
}

function App() {
  return (
    <>
      <HeroSection />
      <EcosystemGrid />
      <Suspense fallback={<SectionLoader />}>
        <IntelligenceChat />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ActivityStream />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <ListeningSpiral />
      </Suspense>
      <Suspense fallback={<SectionLoader />}>
        <IdeasCatalog />
      </Suspense>
    </>
  )
}

export default App
