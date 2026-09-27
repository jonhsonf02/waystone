import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { listShipments } from '../api/adminClient.js';
import AdminLayout from '../components/AdminLayout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const auth = useAuth();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listShipments(auth)
      .then((res) => setShipments(res.shipments))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth.accessToken]);

  const inTransitCount = shipments.filter(s => !['delivered', 'order_created'].includes(s.currentStatus)).length;
  const deliveredCount = shipments.filter(s => s.currentStatus === 'delivered').length;
  const exceptionCount = shipments.filter(s => ['exception', 'on_hold'].includes(s.currentStatus)).length;

  return (
    <AdminLayout>
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of all shipments</p>
        </div>
        <Link to="/admin/shipments/new" className="dashboard-cta">+ New Shipment</Link>
      </header>

      <section className="dashboard-stats">
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Total Shipments</p>
          <p className="dashboard-stat-value">{shipments.length}</p>
        </div>
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">In Transit</p>
          <p className="dashboard-stat-value">{inTransitCount}</p>
        </div>
        <div className="dashboard-stat-card">
          <p className="dashboard-stat-label">Delivered</p>
          <p className="dashboard-stat-value">{deliveredCount}</p>
        </div>
        <div className="dashboard-stat-card dashboard-stat-card--warning">
          <p className="dashboard-stat-label">Exceptions</p>
          <p className="dashboard-stat-value">{exceptionCount}</p>
        </div>
      </section>

      <section className="dashboard-table-card">
        <h2 className="dashboard-table-title">Recent Shipments</h2>
        {loading && <p className="dashboard-empty">Loading…</p>}
        {error && <p className="dashboard-empty dashboard-empty--error">{error}</p>}
        {!loading && !error && shipments.length === 0 && (
          <p className="dashboard-empty">No shipments yet — create your first one.</p>
        )}
        {!loading && shipments.length > 0 && (
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Recipient</th>
                <th>Route</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s._id} onClick={() => window.location.href = `/admin/shipments/${s._id}`}>
                  <td className="dashboard-table-tracking">{s.trackingNumber}</td>
                  <td>{s.recipient?.fullName || '—'}</td>
                  <td>{s.origin.city} → {s.destination.city}</td>
                  <td><StatusBadge status={s.currentStatus} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}

export default AdminDashboardPage;