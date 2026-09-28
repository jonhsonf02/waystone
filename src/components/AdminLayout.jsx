import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const { user, logoutSession } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  function handleLogout() {
    logoutSession();
    navigate('/login');
  }

  function handleNavigate() {
    setNavOpen(false);
  }

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <button
          className="admin-topbar-menu-btn"
          onClick={() => setNavOpen(true)}
          aria-label="Open navigation"
          aria-expanded={navOpen}
        >
          <span className="admin-topbar-menu-icon" />
        </button>
        <div className="admin-topbar-brand">
          <img src="/images/waystone.png" alt="" className="admin-topbar-mark" />
          <span>Waystone</span>
        </div>
        <div className="admin-topbar-avatar">{user?.fullName?.[0] || 'U'}</div>
      </header>

      {navOpen && (
        <button className="admin-nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation" />
      )}

      <aside className={`admin-sidebar ${navOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src="/images/waystone.png" alt="Waystone" className="admin-sidebar-mark" />
          <span>Waystone</span>
          <button className="admin-sidebar-close" onClick={() => setNavOpen(false)} aria-label="Close navigation">✕</button>
        </div>
        <nav className="admin-sidebar-nav">
          <Link to="/admin" className="admin-sidebar-link admin-sidebar-link--active" onClick={handleNavigate}>Dashboard</Link>
          {user?.role === 'superadmin' && (
            <Link to="/admin/audit-log" className="admin-sidebar-link" onClick={handleNavigate}>Audit Log</Link>
          )}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">{user?.fullName?.[0] || 'U'}</div>
            <div>
              <p className="admin-sidebar-name">{user?.fullName}</p>
              <p className="admin-sidebar-role">{user?.role}</p>
            </div>
          </div>
          <button className="admin-sidebar-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}

export default AdminLayout;