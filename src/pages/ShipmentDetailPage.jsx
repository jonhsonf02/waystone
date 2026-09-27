import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getShipmentDetail, pushEvent, editEvent, toggleAutomation, updateShipment } from '../api/adminClient.js';
import AdminLayout from '../components/AdminLayout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Timeline from '../components/Timeline.jsx';
import './ShipmentDetailPage.css';

const STATUS_OPTIONS = [
  'order_created', 'picked_up', 'in_transit', 'arrived_at_facility',
  'departed_facility', 'out_for_delivery', 'delivery_attempted',
  'delivered', 'exception', 'on_hold',
];

function ShipmentDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [eventStatus, setEventStatus] = useState('picked_up');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCity, setEventCity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null);

  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');

  function loadDetail() {
    setLoading(true);
    getShipmentDetail(auth, id)
      .then((res) => {
        setShipment(res.shipment);
        setEvents(res.events);
        setDateInput(res.shipment.estimatedDeliveryDate ? res.shipment.estimatedDeliveryDate.slice(0, 10) : '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadDetail, [auth.accessToken, id]);

  function openPushModal(presetStatus) {
    setEventStatus(presetStatus || 'picked_up');
    setEventDescription('');
    setEventCity('');
    setShowModal(true);
  }

  async function handlePushEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pushEvent(auth, id, {
        status: eventStatus,
        description: eventDescription,
        location: { city: eventCity },
      });
      setShowModal(false);
      loadDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function openEditModal(event) {
    setEditingEvent({
      _id: event._id,
      status: event.status,
      description: event.description,
      city: event.location?.city || '',
    });
  }

  async function handleEditEvent(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await editEvent(auth, editingEvent._id, {
        status: editingEvent.status,
        description: editingEvent.description,
        location: { city: editingEvent.city },
      });
      setEditingEvent(null);
      loadDetail();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleAutomation() {
    try {
      const res = await toggleAutomation(auth, id);
      setShipment(res.shipment);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSaveDate() {
    try {
      const res = await updateShipment(auth, id, { estimatedDeliveryDate: dateInput || null });
      setShipment(res.shipment);
      setEditingDate(false);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCopyLink() {
    const fullLink = `${window.location.origin}/track/${shipment.trackingLinkToken}`;
    navigator.clipboard.writeText(fullLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <AdminLayout><p>Loading…</p></AdminLayout>;
  if (error && !shipment) return <AdminLayout><p className="detail-error">{error}</p></AdminLayout>;

  return (
    <AdminLayout>
      <header className="detail-header">
        <div>
          <p className="detail-eyebrow">Shipment</p>
          <h1 className="detail-title">{shipment.trackingNumber}</h1>
        </div>
        <div className="detail-header-right">
          <StatusBadge status={shipment.currentStatus} />
          <button className="detail-secondary-btn" onClick={() => openPushModal('picked_up')}>Mark Picked Up</button>
          <button className="detail-push-btn" onClick={() => openPushModal()}>+ Push Update</button>
        </div>
      </header>

      <section className="detail-link-card">
        <div>
          <p className="detail-link-label">Client Tracking Link</p>
          <p className="detail-link-value">{window.location.origin}/track/{shipment.trackingLinkToken}</p>
        </div>
        <button className="detail-copy-btn" onClick={handleCopyLink}>{copied ? '✓ Copied' : 'Copy Link'}</button>
      </section>

      <section className="detail-summary">
        <div>
          <p className="detail-summary-label">Recipient</p>
          <p>{shipment.recipient?.fullName}</p>
        </div>
        <div>
          <p className="detail-summary-label">Route</p>
          <p>{shipment.origin.city} → {shipment.destination.city}</p>
        </div>
        <div>
          <p className="detail-summary-label">Parcel Contents</p>
          <p>{shipment.description}</p>
        </div>
        <div>
          <p className="detail-summary-label">Estimated Delivery</p>
          {editingDate ? (
            <div className="detail-date-edit">
              <input type="date" className="form-input" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
              <button className="detail-date-save" onClick={handleSaveDate}>Save</button>
              <button className="detail-date-cancel" onClick={() => setEditingDate(false)}>✕</button>
            </div>
          ) : (
            <div className="detail-date-row">
              <p>{shipment.estimatedDeliveryDate ? new Date(shipment.estimatedDeliveryDate).toLocaleDateString() : 'Not set'}</p>
              <button className="detail-toggle-btn" onClick={() => setEditingDate(true)}>Edit</button>
            </div>
          )}
        </div>
        <div>
          <p className="detail-summary-label">Automated Tracking</p>
          <div className="detail-automation-row">
            <span className={shipment.isAutomatedTrackingEnabled ? 'detail-automation-on' : 'detail-automation-off'}>
              {shipment.isAutomatedTrackingEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button className="detail-toggle-btn" onClick={handleToggleAutomation}>
              {shipment.isAutomatedTrackingEnabled ? 'Switch to Manual Only' : 'Re-enable Automation'}
            </button>
          </div>
        </div>
      </section>

      {shipment.waypoints?.length > 0 && (
        <section className="detail-waypoints-card">
          <h2 className="detail-timeline-title">Planned Route</h2>
          <div className="detail-waypoints-list">
            {shipment.waypoints.map((wp, i) => (
              <div className="detail-waypoint-chip" key={i}>
                <span className="detail-waypoint-label">{wp.label || 'Stop'}</span>
                <span>{wp.city}{wp.state ? `, ${wp.state}` : ''}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="detail-timeline-card">
        <h2 className="detail-timeline-title">Tracking History</h2>
        <Timeline events={events} onEdit={openEditModal} />
      </section>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handlePushEvent}>
            <h2 className="modal-title">Push Manual Update</h2>

            <label className="form-label">
              Status
              <select className="form-input" value={eventStatus} onChange={(e) => setEventStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>

            <label className="form-label">
              Current Location (city, country)
              <input className="form-input" value={eventCity} onChange={(e) => setEventCity(e.target.value)} placeholder="e.g. Washington, United States" />
            </label>

            <label className="form-label">
              Description (shown to client)
              <textarea className="form-input" rows="3" value={eventDescription} onChange={(e) => setEventDescription(e.target.value)} required placeholder="e.g. Package arrived at regional hub" />
            </label>

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="modal-submit" disabled={submitting}>{submitting ? 'Pushing…' : 'Push Update'}</button>
            </div>
          </form>
        </div>
      )}

      {editingEvent && (
        <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleEditEvent}>
            <h2 className="modal-title">Edit Update</h2>

            <label className="form-label">
              Status
              <select className="form-input" value={editingEvent.status} onChange={(e) => setEditingEvent({ ...editingEvent, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </label>

            <label className="form-label">
              Current Location (city, country)
              <input className="form-input" value={editingEvent.city} onChange={(e) => setEditingEvent({ ...editingEvent, city: e.target.value })} placeholder="e.g. Washington, United States" />
            </label>

            <label className="form-label">
              Description (shown to client)
              <textarea className="form-input" rows="3" value={editingEvent.description} onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })} required />
            </label>

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setEditingEvent(null)}>Cancel</button>
              <button type="submit" className="modal-submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}
    </AdminLayout>
  );
}

export default ShipmentDetailPage;