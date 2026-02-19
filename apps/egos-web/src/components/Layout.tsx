import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { user, loading, avatarUrl, username, signInWithGitHub, signOut, isAuthenticated } = useAuth()

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
          <Link to="/api-docs" className={`nav-link ${location.pathname === '/api-docs' ? 'active' : ''}`}>
            APIs
          </Link>
          <Link to="/audit" className={`nav-link ${location.pathname === '/audit' ? 'active' : ''}`} style={{ color: '#10b981', fontWeight: 600 }}>
            Audit Hub
          </Link>
        </nav>
        <div className="top-bar-right">
          {loading ? (
            <div className="auth-skeleton" />
          ) : isAuthenticated ? (
            <div className="auth-user">
              <Link to="/new-project" className="hub-btn-small">+ Projeto</Link>
              <Link to={`/u/${username || user?.id}`} className="auth-avatar-link">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={username || ''} className="auth-avatar" />
                ) : (
                  <div className="auth-avatar-placeholder">{(username || 'U')[0].toUpperCase()}</div>
                )}
              </Link>
              <Link to="/settings" className="auth-settings" title="Configurações">⚙</Link>
              <button onClick={signOut} className="auth-signout" title="Sair">✕</button>
            </div>
          ) : (
            <button onClick={signInWithGitHub} className="auth-github-btn">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" /></svg>
              Login com GitHub
            </button>
          )}
        </div>
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
