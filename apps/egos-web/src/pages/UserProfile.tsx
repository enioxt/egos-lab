import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { HubProfile, HubProject } from '../types/hub'

export default function UserProfile() {
  const { handle } = useParams<{ handle: string }>()
  const { user, isAuthenticated, username } = useAuth()
  const [profile, setProfile] = useState<HubProfile | null>(null)
  const [projects, setProjects] = useState<HubProject[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const isOwnProfile = isAuthenticated && (handle === username || handle === user?.id)

  useEffect(() => {
    if (!handle) return
    async function load() {
      let prof: HubProfile | null = null

      const { data: byHandle } = await supabase
        .from('hub_profiles')
        .select('id, handle, display_name, bio, avatar_url, github_username, website_url, created_at')
        .eq('handle', handle)
        .single()

      if (byHandle) {
        prof = byHandle as HubProfile
      } else if (user) {
        const { data: byId } = await supabase
          .from('hub_profiles')
          .select('id, handle, display_name, bio, avatar_url, github_username, website_url, created_at')
          .eq('id', user.id)
          .single()
        if (byId) prof = byId as HubProfile
      }

      if (!prof && isOwnProfile && user) {
        const newHandle = username || handle || 'user'
        const { data: created } = await supabase
          .from('hub_profiles')
          .upsert({
            id: user.id,
            handle: newHandle,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name || newHandle,
            avatar_url: user.user_metadata?.avatar_url || null,
            github_username: user.user_metadata?.user_name || null,
          }, { onConflict: 'id' })
          .select('id, handle, display_name, bio, avatar_url, github_username, website_url, created_at')
          .single()
        if (created) prof = created as HubProfile
      }

      if (!prof) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setProfile(prof)

      const { data: projs } = await supabase
        .from('hub_projects')
        .select('id, slug, title, description, github_repo, status, tags, tech_stack, star_count, comment_count, created_at, owner_id')
        .eq('owner_id', prof.id)
        .eq('visibility', 'public')
        .order('star_count', { ascending: false })
        .limit(20)

      if (projs) setProjects(projs as HubProject[])
      setLoading(false)
    }
    load()
  }, [handle, user, isOwnProfile, username])

  if (loading) {
    return (
      <section className="hub-page">
        <div className="hub-detail-skeleton">
          <div className="hub-skeleton-bar wide" />
          <div className="hub-skeleton-bar" />
        </div>
      </section>
    )
  }

  if (notFound || !profile) {
    return (
      <section className="hub-page">
        <div className="hub-empty">
          <div className="hub-empty-icon">👤</div>
          <h3>Perfil não encontrado</h3>
          <p><Link to="/projects">Voltar aos projetos</Link></p>
        </div>
      </section>
    )
  }

  return (
    <section className="hub-page">
      <div className="profile-header">
        <div className="profile-avatar-area">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name || profile.handle} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-placeholder">{profile.handle[0].toUpperCase()}</div>
          )}
        </div>
        <div className="profile-info">
          <h1 className="hub-detail-title">{profile.display_name || profile.handle}</h1>
          <p className="profile-handle">@{profile.handle}</p>
          {profile.bio && <p className="profile-bio">{profile.bio}</p>}
          <div className="profile-links">
            {profile.github_username && (
              <a href={`https://github.com/${profile.github_username}`} target="_blank" rel="noopener noreferrer" className="profile-link">
                GitHub ↗
              </a>
            )}
            {profile.website_url && (
              <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="profile-link">
                Website ↗
              </a>
            )}
          </div>
          <p className="profile-joined">Membro desde {new Date(profile.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div className="profile-projects">
        <h2 className="hub-section-title">Projetos ({projects.length})</h2>
        {projects.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Nenhum projeto público ainda.</p>
        ) : (
          <div className="hub-grid">
            {projects.map((project: HubProject) => (
              <Link to={`/p/${project.slug}`} key={project.id} className="hub-card">
                <h3 className="hub-card-title">{project.title}</h3>
                {project.description && (
                  <p className="hub-card-desc">{project.description.slice(0, 100)}</p>
                )}
                <div className="hub-card-tags">
                  {project.tech_stack.slice(0, 3).map((t: string) => (
                    <span key={t} className="hub-tag">{t}</span>
                  ))}
                </div>
                <div className="hub-card-footer">
                  <span className="hub-card-stat">⭐ {project.star_count}</span>
                  <span className="hub-card-stat">💬 {project.comment_count}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
