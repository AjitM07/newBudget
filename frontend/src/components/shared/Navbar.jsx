import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, PieChart, FileText, LogOut, Eye } from 'lucide-react'
import useAuthStore from '../../store/authStore'

const ADMIN_NAV = [
  { to: '/admin/dashboard',  label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/admin/allocation', label: 'Allocate',   Icon: PieChart },
  { to: '/admin/reports',    label: 'Reports',    Icon: FileText },
]

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const { pathname }     = useLocation()
  const navigate         = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  return (
    <nav style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 58, gap: 8 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, marginRight: 24 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--accent)', display: 'grid', placeItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 13, color: '#fff' }}>B</span>
          </div>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
            Budget<span style={{ color: 'var(--accent-lt)' }}>OS</span>
          </span>
        </Link>

        {/* Admin nav links */}
        {user?.role === 'admin' && ADMIN_NAV.map(({ to, label, Icon }) => {
          const active = pathname === to
          return (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              color:      active ? 'var(--accent-lt)' : 'var(--text2)',
              background: active ? 'var(--accent-gl)' : 'transparent',
            }}>
              <Icon size={14} />
              {label}
            </Link>
          )
        })}

        {/* Citizen nav link */}
        {user?.role === 'citizen' && (
          <Link to="/citizen/view" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
            fontSize: 13, fontWeight: 500, color: 'var(--green-lt)',
          }}>
            <Eye size={14} /> Public View
          </Link>
        )}

        {/* Right side — user info + logout */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {user && (
            <>
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>
                  {user.role}{user.region ? ` · ${user.region}` : ''}
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red-lt)'; e.currentTarget.style.color = 'var(--red-lt)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)' }}
              >
                <LogOut size={13} /> Logout
              </button>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}
