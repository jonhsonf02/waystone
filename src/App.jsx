import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import PublicTrackingPage from './pages/PublicTrackingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NewShipmentPage from './pages/NewShipmentPage.jsx';
import ShipmentDetailPage from './pages/ShipmentDetailPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/track/:token" element={<PublicTrackingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/shipments/new" element={<ProtectedRoute><NewShipmentPage /></ProtectedRoute>} />
      <Route path="/admin/shipments/:id" element={<ProtectedRoute><ShipmentDetailPage /></ProtectedRoute>} />
      <Route path="/admin/audit-log" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
      <Route path="*" element={<div style={{ padding: '2rem' }}>Page not found. <a href="/">Go home</a></div>} />
    </Routes>
  );
}

export default App;