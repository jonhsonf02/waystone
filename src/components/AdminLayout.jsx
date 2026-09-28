import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './AdminLayout.css';

function AdminLayout({ children }) {
  const { user, logoutSession } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logoutSession();
    navigate('/login');
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <img src="/images/waystone.png" alt="Waystone" className="admin-sidebar-mark" />
          <span>Waystone</span>
        </div>
        <nav className="admin-sidebar-nav">
          <Link to="/admin" className="admin-sidebar-link admin-sidebar-link--active">Dashboard</Link>
          {user?.role === 'superadmin' && (
            <Link to="/admin/audit-log" className="admin-sidebar-link">Audit Log</Link>
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