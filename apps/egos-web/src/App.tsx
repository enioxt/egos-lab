import { motion } from 'framer-motion'
import ListeningSpiral from './components/ListeningSpiral'
import CommunityChat from './components/CommunityChat'
import Dashboard from './components/Dashboard'
import { useAppStore } from './store/useAppStore'
import './App.css'

function App() {
  const { activeView, setActiveView } = useAppStore()

  return (
    <div className="mission-control">
      {/* Top Bar */}
      <header className="top-bar">
        <div className="top-bar-left">
          <div className="logo-mark">
            <span className="logo-pulse" />
            <span className="logo-text">EGOS</span>
          </div>
          <span className="top-bar-divider" />
          <span className="top-bar-label">Mission Control</span>
        </div>
        <nav className="top-bar-nav">
          <button
            className={`nav-tab ${activeView === 'spiral' ? 'active' : ''}`}
            onClick={() => setActiveView('spiral')}
          >
            Spiral
          </button>
          <button
            className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            Dashboard
          </button>
        </nav>
        <div className="top-bar-right">
          <a
            href="https://github.com/enioxt/egos-lab"
            target="_blank"
            rel="noopener noreferrer"
            className="gh-link"
          >
            GitHub ↗
          </a>
        </div>
      </header>

      {/* Main Content — Split View */}
      <main className="split-view">
        <motion.div
          className="panel-spiral"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <ListeningSpiral />
        </motion.div>

        <motion.div
          className="panel-dashboard"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Dashboard />
        </motion.div>
      </main>

      {/* Chat Overlay */}
      <CommunityChat />
    </div>
  )
}

export default App
