const BASE_URL = 'https://wayston.onrender.com/api/v1';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function getShipmentByToken(token) {
  return request(`/track/${token}`);
}

export function getShipmentByNumber(trackingNumber) {
  return request(`/track/number/${trackingNumber}`);
}

export function subscribeToUpdates(token, channel, contact) {
  return request(`/track/${token}/subscribe`, {
    method: 'POST',
    body: JSON.stringify({ channel, contact }),
  });
}