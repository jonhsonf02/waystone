import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = sessionStorage.getItem('ws_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem('ws_access_token'));
  const [refreshToken, setRefreshToken] = useState(() => sessionStorage.getItem('ws_refresh_token'));

  useEffect(() => {
    if (user) sessionStorage.setItem('ws_user', JSON.stringify(user));
    else sessionStorage.removeItem('ws_user');
  }, [user]);

  useEffect(() => {
    if (accessToken) sessionStorage.setItem('ws_access_token', accessToken);
    else sessionStorage.removeItem('ws_access_token');
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) sessionStorage.setItem('ws_refresh_token', refreshToken);
    else sessionStorage.removeItem('ws_refresh_token');
  }, [refreshToken]);

  function loginSession({ user, accessToken, refreshToken }) {
    setUser(user);
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
  }

  function logoutSession() {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, setAccessToken, loginSession, logoutSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}