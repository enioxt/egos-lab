import HeroSection from './components/HeroSection'
import EcosystemGrid from './components/EcosystemGrid'
import IntelligenceChat from './components/IntelligenceChat'
import ActivityStream from './components/ActivityStream'
import IdeasCatalog from './components/IdeasCatalog'
import ListeningSpiral from './components/ListeningSpiral'
import './App.css'

function App() {
  return (
    <div className="app">
      {/* Sticky Header */}
      <header className="top-bar">
        <div className="top-bar-left">
          <span className="logo-pulse" />
          <span className="logo-text">EGOS</span>
        </div>
        <nav className="top-bar-nav">
          <a href="#ecosystem" className="nav-link">Ecossistema</a>
          <a href="#intelligence" className="nav-link">Intelligence</a>
          <a href="#activity" className="nav-link">Atividade</a>
          <a href="#spiral" className="nav-link">Espiral</a>
          <a href="#ideas" className="nav-link">Ideias</a>
        </nav>
        <a
          href="https://github.com/enioxt/egos-lab"
          target="_blank"
          rel="noopener noreferrer"
          className="gh-link"
        >
          GitHub ↗
        </a>
      </header>

      {/* Sections */}
      <HeroSection />
      <EcosystemGrid />
      <IntelligenceChat />
      <ActivityStream />
      <ListeningSpiral />
      <IdeasCatalog />

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="logo-pulse" />
            <span>EGOS Lab</span>
          </div>
          <p className="footer-copy">Open Source · AGPL-3.0 · Agentic Engineering</p>
          <p className="footer-sacred">000.111.369.963.1618</p>
        </div>
      </footer>
    </div>
  )
}

export default App
