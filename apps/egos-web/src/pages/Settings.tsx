import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import type { HubProfile } from '../types/hub'

export default function Settings() {
  const { user, isAuthenticated, signInWithGitHub, username, avatarUrl } = useAuth()
  const [profile, setProfile] = useState<HubProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')

  useEffect(() => {
    if (!user) { setLoading(false); return }
    async function load() {
      const { data } = await supabase
        .from('hub_profiles')
        .select('id, handle, display_name, bio, avatar_url, github_username, website_url, created_at')
        .eq('id', user!.id)
        .single()

      if (data) {
        const p = data as HubProfile
        setProfile(p)
        setDisplayName(p.display_name || '')
        setBio(p.bio || '')
        setWebsiteUrl(p.website_url || '')
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (!isAuthenticated) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">🔒</div>
          <h3>Login necessário</h3>
          <p>Faça login para acessar as configurações.</p>
          <button onClick={signInWithGitHub} className="auth-github-btn" style={{ marginTop: 16 }}>
            Login com GitHub
          </button>
        </div>
      </section>
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setSaved(false)

    await supabase
      .from('hub_profiles')
      .update({
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        website_url: websiteUrl.trim() || null,
      })
      .eq('id', user.id)

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <section className="hub-page">
      <div className="hub-header">
        <h1 className="hub-title">Configurações</h1>
        <p className="hub-subtitle">Gerencie seu perfil e conexões.</p>
      </div>

      {loading ? (
        <div className="hub-detail-skeleton">
          <div className="hub-skeleton-bar wide" />
          <div className="hub-skeleton-bar" />
        </div>
      ) : (
        <div className="settings-grid">
          <div className="settings-section">
            <h2 className="hub-section-title">Conexões</h2>
            <div className="settings-card">
              <div className="settings-connection">
                <div className="settings-connection-left">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" style={{ color: '#fff' }}><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
                  <div>
                    <strong>GitHub</strong>
                    <p className="settings-connection-detail">
                      {profile?.github_username ? `@${profile.github_username}` : username ? `@${username}` : 'Conectado'}
                    </p>
                  </div>
                </div>
                <span className="settings-connected">Conectado ✓</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2 className="hub-section-title">Perfil</h2>
            <form onSubmit={handleSave} className="settings-card">
              <div className="settings-avatar-row">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-placeholder">{(username || 'U')[0].toUpperCase()}</div>
                )}
                <div>
                  <p style={{ color: '#fff', fontWeight: 600 }}>{profile?.handle || username}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{user?.email}</p>
                </div>
              </div>

              <label className="wizard-label">Nome de exibição</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder={username || 'Seu nome'} />

              <label className="wizard-label">Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="hub-textarea" rows={3} placeholder="Fale sobre você..." />

              <label className="wizard-label">Website</label>
              <input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="hub-search" style={{ width: '100%', marginBottom: 16 }} placeholder="https://seusite.com" />

              <div className="wizard-nav">
                <Link to={`/u/${profile?.handle || username || ''}`} className="hub-btn-secondary">Ver perfil</Link>
                <button type="submit" className="hub-btn-primary" disabled={saving}>
                  {saving ? 'Salvando...' : saved ? 'Salvo ✓' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
