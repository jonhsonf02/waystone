import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { listAuditLog } from '../api/adminClient.js';
import AdminLayout from '../components/AdminLayout.jsx';
import './AuditLogPage.css';

function AuditLogPage() {
  const auth = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listAuditLog(auth)
      .then((res) => setEntries(res.entries))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auth.accessToken]);

  return (
    <AdminLayout>
      <header className="audit-header">
        <h1 className="audit-title">Audit Log</h1>
        <p className="audit-subtitle">Immutable record of every staff action</p>
      </header>

      <section className="audit-card">
        {loading && <p className="audit-empty">Loading…</p>}
        {error && <p className="audit-empty audit-empty--error">{error}</p>}
        {!loading && !error && entries.length === 0 && <p className="audit-empty">No audit entries yet.</p>}
        {!loading && entries.length > 0 && (
          <table className="audit-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.created_at).toLocaleString()}</td>
                  <td>{e.actor_name || '—'}</td>
                  <td><span className="audit-action">{e.action}</span></td>
                  <td>{e.target_type} <span className="audit-target-id">{e.target_id.slice(0, 8)}…</span></td>
                  <td className="audit-details">{e.details ? JSON.stringify(e.details) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}

export default AuditLogPage;