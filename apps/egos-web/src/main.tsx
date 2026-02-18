import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './index.css'
import App from './App.tsx'
import Layout from './components/Layout.tsx'

const ProjectsFeed = lazy(() => import('./pages/ProjectsFeed.tsx'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail.tsx'))
const LegalLab = lazy(() => import('./pages/LegalLab.tsx'))
const NewProject = lazy(() => import('./pages/NewProject.tsx'))
const HelpRequests = lazy(() => import('./pages/HelpRequests.tsx'))
const NewHelpRequest = lazy(() => import('./pages/NewHelpRequest.tsx'))
const HelpDetail = lazy(() => import('./pages/HelpDetail.tsx'))
const UserProfile = lazy(() => import('./pages/UserProfile.tsx'))
const Settings = lazy(() => import('./pages/Settings.tsx'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="loader-pulse" />
    </div>
  )
}

const S = ({ children }: { children: React.ReactNode }) => <Suspense fallback={<PageLoader />}>{children}</Suspense>

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/projects" element={<S><ProjectsFeed /></S>} />
          <Route path="/p/:slug" element={<S><ProjectDetail /></S>} />
          <Route path="/p/:slug/help" element={<S><HelpRequests /></S>} />
          <Route path="/p/:slug/help/new" element={<S><NewHelpRequest /></S>} />
          <Route path="/help/:id" element={<S><HelpDetail /></S>} />
          <Route path="/new-project" element={<S><NewProject /></S>} />
          <Route path="/u/:handle" element={<S><UserProfile /></S>} />
          <Route path="/settings" element={<S><Settings /></S>} />
          <Route path="/legal" element={<S><LegalLab /></S>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
