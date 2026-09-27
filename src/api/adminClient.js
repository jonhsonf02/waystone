import { apiRequest } from './apiClient.js';

export function listShipments(auth, page = 1) {
  return apiRequest(auth, `/admin/shipments?page=${page}`);
}

export function getShipmentDetail(auth, id) {
  return apiRequest(auth, `/admin/shipments/${id}`);
}

export function createShipment(auth, payload) {
  return apiRequest(auth, '/admin/shipments', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateShipment(auth, id, payload) {
  return apiRequest(auth, `/admin/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function pushEvent(auth, shipmentId, payload) {
  return apiRequest(auth, `/admin/shipments/${shipmentId}/events`, { method: 'POST', body: JSON.stringify(payload) });
}

export function editEvent(auth, eventId, payload) {
  return apiRequest(auth, `/admin/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function toggleAutomation(auth, shipmentId) {
  return apiRequest(auth, `/admin/shipments/${shipmentId}/toggle-automation`, { method: 'PATCH' });
}

export function listAuditLog(auth, page = 1) {
  return apiRequest(auth, `/admin/audit-log?page=${page}`);
}