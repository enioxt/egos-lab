import { Outlet, Link, useLocation } from 'react-router-dom'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <div className="app">
      <header className="top-bar">
        <div className="top-bar-left">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <span className="logo-pulse" />
            <span className="logo-text">EGOS</span>
          </Link>
        </div>
        <nav className="top-bar-nav">
          {isHome ? (
            <>
              <a href="#ecosystem" className="nav-link">Ecossistema</a>
              <a href="#intelligence" className="nav-link">Intelligence</a>
              <a href="#ideas" className="nav-link">Ideias</a>
            </>
          ) : null}
          <Link to="/projects" className={`nav-link ${location.pathname === '/projects' ? 'active' : ''}`}>
            Projetos
          </Link>
          <Link to="/legal" className={`nav-link ${location.pathname === '/legal' ? 'active' : ''}`}>
            LegalLab
          </Link>
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

      <Outlet />

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
