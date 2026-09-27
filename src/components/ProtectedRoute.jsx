import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { user, accessToken } = useAuth();
  if (!user || !accessToken) return <Navigate to="/login" replace />;
  return children;
}

export default ProtectedRoute;