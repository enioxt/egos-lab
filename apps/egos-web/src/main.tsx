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

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="loader-pulse" />
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<App />} />
          <Route path="/projects" element={<Suspense fallback={<PageLoader />}><ProjectsFeed /></Suspense>} />
          <Route path="/p/:slug" element={<Suspense fallback={<PageLoader />}><ProjectDetail /></Suspense>} />
          <Route path="/legal" element={<Suspense fallback={<PageLoader />}><LegalLab /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
