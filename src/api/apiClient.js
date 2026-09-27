const BASE_URL = 'http://localhost:5000/api/v1';

async function rawRequest(path, token, options = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// auth = the object returned by useAuth() — needs accessToken, refreshToken, setAccessToken, logoutSession
export async function apiRequest(auth, path, options = {}) {
  let res = await rawRequest(path, auth.accessToken, options);

  if (res.status === 401 && auth.refreshToken) {
    // Access token expired — silently refresh and retry once, no error shown to user
    try {
      const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      });
      const refreshData = await refreshRes.json();
      if (!refreshRes.ok) throw new Error(refreshData.error || 'Refresh failed');

      auth.setAccessToken(refreshData.accessToken);
      res = await rawRequest(path, refreshData.accessToken, options);
    } catch (err) {
      auth.logoutSession();
      window.location.href = '/login';
      throw new Error('Your session expired — please sign in again');
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}