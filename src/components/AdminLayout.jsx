import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const { user, logoutSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const auditActive = location.pathname.startsWith('/admin/audit-log');
  const dashboardActive = !auditActive;

  function handleLogout() {
    logoutSession();
    navigate('/login');
  }

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // While the drawer is open: lock page scroll and allow Escape to close it
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKeyDown(e) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="admin-layout">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <img src="/images/waystone.png" alt="Waystone" className="admin-topbar-mark" />
          <span>Waystone</span>
        </div>
        <button
          type="button"
          className="admin-topbar-menu"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls="admin-sidebar"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      <div
        className={`admin-backdrop ${menuOpen ? 'admin-backdrop--open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      <aside id="admin-sidebar" className={`admin-sidebar ${menuOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-brand">
          <img src="/images/waystone.png" alt="Waystone" className="admin-sidebar-mark" />
          <span>Waystone</span>
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className="admin-sidebar-nav">
          <Link
            to="/admin"
            className={`admin-sidebar-link ${dashboardActive ? 'admin-sidebar-link--active' : ''}`}
          >
            Dashboard
          </Link>
          {user?.role === 'superadmin' && (
            <Link
              to="/admin/audit-log"
              className={`admin-sidebar-link ${auditActive ? 'admin-sidebar-link--active' : ''}`}
            >
              Audit Log
            </Link>
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