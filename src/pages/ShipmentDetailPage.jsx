import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

const EMPTY_FORM = { status: 'picked_up', description: '', city: '', lat: '', lng: '' };

/* ---------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------ */

async function geocodeLocation(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=en&q=${encodeURIComponent(query)}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error('Could not reach the location service. Check your connection, or enter coordinates manually.');
  }
  if (!res.ok) {
    throw new Error('The location service is busy. Try again in a moment, or enter coordinates manually.');
  }

  const data = await res.json();
  if (!data[0]) {
    throw new Error('No matching location found. Try "City, Country", or enter coordinates manually.');
  }

  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('The location service returned an unusable result. Enter coordinates manually.');
  }
  return { lat, lng };
}

// Both empty is fine. One without the other, or out-of-range numbers, is not.
function parseCoordinates(latText, lngText) {
  const hasLat = latText.trim() !== '';
  const hasLng = lngText.trim() !== '';

  if (!hasLat && !hasLng) return { lat: undefined, lng: undefined };
  if (hasLat !== hasLng) throw new Error('Enter both latitude and longitude, or leave both empty.');

  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    throw new Error('Latitude must be a number between -90 and 90.');
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    throw new Error('Longitude must be a number between -180 and 180.');
  }
  return { lat, lng };
}

// Delivery dates are stored as calendar dates, so show them in UTC.
// That matches the date picker (which reads the first 10 characters of the ISO
// string) and stops the day shifting for people west of UTC.
function formatDate(value) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/* ---------------------------------------------------------------------------
   One modal for both "push" and "edit"
   ------------------------------------------------------------------------ */

function EventFormModal({ title, form, onPatch, onSubmit, onClose, submitting, submitLabel, submittingLabel, error }) {
  const dialogRef = useRef(null);
  const latest = useRef({ onClose, submitting });
  latest.current = { onClose, submitting };

  const geocodeSeq = useRef(0);
  const [geocoding, setGeocoding] = useState(false);
  const [lookupError, setLookupError] = useState(null);

  // Focus the dialog, lock page scroll, close on Escape, and put focus back when done.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape' && !latest.current.submitting) latest.current.onClose();
    }
    window.addEventListener('keydown', onKeyDown);

    return () => {
      geocodeSeq.current += 1; // ignore any lookup still in flight
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
    };
  }, []);

  function patch(change) {
    setLookupError(null);
    onPatch(change);
  }

  async function handleFindCoordinates() {
    if (!form.city.trim()) {
      setLookupError('Enter a city first, then find coordinates.');
      return;
    }

    const seq = ++geocodeSeq.current;
    setGeocoding(true);
    setLookupError(null);
    try {
      const { lat, lng } = await geocodeLocation(form.city.trim());
      if (seq !== geocodeSeq.current) return;
      onPatch({ lat: lat.toFixed(6), lng: lng.toFixed(6) });
    } catch (err) {
      if (seq === geocodeSeq.current) setLookupError(err.message);
    } finally {
      if (seq === geocodeSeq.current) setGeocoding(false);
    }
  }

  const shownError = lookupError || error;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        // only a press that starts on the dark backdrop closes it, so dragging
        // a text selection out of a field never dismisses the form
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        ref={dialogRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        tabIndex={-1}
        onSubmit={onSubmit}
      >
        <h2 className="modal-title" id="event-modal-title">{title}</h2>

        {shownError && <p className="modal-error" role="alert">{shownError}</p>}

        <label className="form-label">
          Status
          <select className="form-input" value={form.status} onChange={(e) => patch({ status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </label>

        <label className="form-label">
          Current Location (city, country)
          <input
            className="form-input"
            value={form.city}
            onChange={(e) => patch({ city: e.target.value })}
            placeholder="e.g. Washington, United States"
            autoComplete="off"
          />
        </label>

        <button type="button" className="detail-geocode-btn" onClick={handleFindCoordinates} disabled={geocoding}>
          {geocoding ? 'Finding…' : '📍 Find Coordinates on Map'}
        </button>

        <div className="detail-latlng-row">
          <label className="form-label">
            Latitude
            <input
              className="form-input"
              value={form.lat}
              onChange={(e) => patch({ lat: e.target.value })}
              placeholder="e.g. 38.9072"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="form-label">
            Longitude
            <input
              className="form-input"
              value={form.lng}
              onChange={(e) => patch({ lng: e.target.value })}
              placeholder="e.g. -77.0369"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
        </div>

        <label className="form-label">
          Description (shown to client)
          <textarea
            className="form-input"
            rows="3"
            value={form.description}
            onChange={(e) => patch({ description: e.target.value })}
            required
            placeholder="e.g. Package arrived at regional hub"
          />
        </label>

        <div className="modal-actions">
          <button type="button" className="modal-cancel" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="modal-submit" disabled={submitting}>
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------ */

function ShipmentDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const authRef = useRef(auth);
  authRef.current = auth;

  const [shipment, setShipment] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Three kinds of error, each shown where the person is looking:
  //   loadError   - the page could not load at all
  //   actionError - a banner for page-level actions (copy, automation, date, refresh)
  //   modalError  - inside the open modal (push / edit failures)
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [modalError, setModalError] = useState(null);

  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);

  const [pushOpen, setPushOpen] = useState(false);
  const [pushForm, setPushForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [editingDate, setEditingDate] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [savingDate, setSavingDate] = useState(false);
  const [automationBusy, setAutomationBusy] = useState(false);

  const loadSeq = useRef(0);
  const loadedId = useRef(null);

  // Loads (or quietly refreshes) the shipment. A refresh never blanks the page,
  // so the scroll position and any open UI stay put. Out-of-date responses are ignored.
  const loadDetail = useCallback(async ({ silent = false } = {}) => {
    const seq = ++loadSeq.current;
    if (!silent) setLoading(true);
    try {
      const res = await getShipmentDetail(authRef.current, id);
      if (seq !== loadSeq.current) return;
      setShipment(res.shipment);
      setEvents(res.events || []);
      setDateInput(res.shipment.estimatedDeliveryDate ? res.shipment.estimatedDeliveryDate.slice(0, 10) : '');
      setLoadError(null);
      loadedId.current = id;
    } catch (err) {
      if (seq !== loadSeq.current) return;
      if (silent) setActionError(`Your change was saved, but the page could not refresh: ${err.message}`);
      else setLoadError(err.message);
    } finally {
      if (seq === loadSeq.current && !silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    // first visit to this shipment shows the loader; token refreshes reload quietly
    loadDetail({ silent: loadedId.current === id });
  }, [auth.accessToken, id, loadDetail]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  /* ---- push modal ---- */

  function openPushModal(presetStatus) {
    setModalError(null);
    setEditForm(null);
    setPushForm({ ...EMPTY_FORM, status: presetStatus || 'picked_up' });
    setPushOpen(true);
  }

  function closePushModal() {
    setPushOpen(false);
    setModalError(null);
  }

  function patchPushForm(change) {
    setModalError(null);
    setPushForm((f) => ({ ...f, ...change }));
  }

  async function handlePushEvent(e) {
    e.preventDefault();
    if (submitting) return;
    setModalError(null);

    let coords;
    try {
      coords = parseCoordinates(pushForm.lat, pushForm.lng);
    } catch (err) {
      setModalError(err.message);
      return;
    }

    setSubmitting(true);
    try {
      await pushEvent(auth, id, {
        status: pushForm.status,
        description: pushForm.description.trim(),
        location: { city: pushForm.city.trim(), lat: coords.lat, lng: coords.lng },
      });
      setPushOpen(false);
      await loadDetail({ silent: true });
    } catch (err) {
      setModalError(err.message || 'Could not push the update. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---- edit modal ---- */

  function openEditModal(event) {
    setModalError(null);
    setPushOpen(false);
    setEditForm({
      _id: event._id,
      status: event.status,
      description: event.description || '',
      city: event.location?.city || '',
      lat: event.location?.lat != null ? String(event.location.lat) : '',
      lng: event.location?.lng != null ? String(event.location.lng) : '',
    });
  }

  function closeEditModal() {
    setEditForm(null);
    setModalError(null);
  }

  function patchEditForm(change) {
    setModalError(null);
    setEditForm((f) => ({ ...f, ...change }));
  }

  async function handleEditEvent(e) {
    e.preventDefault();
    if (submitting) return;
    setModalError(null);

    let coords;
    try {
      coords = parseCoordinates(editForm.lat, editForm.lng);
    } catch (err) {
      setModalError(err.message);
      return;
    }

    setSubmitting(true);
    try {
      await editEvent(auth, editForm._id, {
        status: editForm.status,
        description: editForm.description.trim(),
        location: { city: editForm.city.trim(), lat: coords.lat, lng: coords.lng },
      });
      setEditForm(null);
      await loadDetail({ silent: true });
    } catch (err) {
      setModalError(err.message || 'Could not save the changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ---- automation, delivery date, copy link ---- */

  async function handleToggleAutomation() {
    if (automationBusy) return;
    setActionError(null);
    setAutomationBusy(true);
    try {
      const res = await toggleAutomation(auth, id);
      setShipment(res.shipment);
    } catch (err) {
      setActionError(err.message || 'Could not change automated tracking.');
    } finally {
      setAutomationBusy(false);
    }
  }

  function startEditingDate() {
    setActionError(null);
    setEditingDate(true);
  }

  function cancelEditingDate() {
    // put the saved value back so a half-typed date doesn't linger
    setDateInput(shipment?.estimatedDeliveryDate ? shipment.estimatedDeliveryDate.slice(0, 10) : '');
    setEditingDate(false);
  }

  async function handleSaveDate() {
    if (savingDate) return;
    setActionError(null);
    setSavingDate(true);
    try {
      const res = await updateShipment(auth, id, { estimatedDeliveryDate: dateInput || null });
      setShipment(res.shipment);
      setEditingDate(false);
    } catch (err) {
      setActionError(err.message || 'Could not save the delivery date.');
    } finally {
      setSavingDate(false);
    }
  }

  async function handleCopyLink() {
    const fullLink = `${window.location.origin}/track/${shipment.trackingLinkToken}`;
    setActionError(null);

    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullLink);
        ok = true;
      }
    } catch {
      ok = false;
    }

    // older browsers and some iPhones block the clipboard API; fall back to a hidden field
    if (!ok) {
      const field = document.createElement('textarea');
      field.value = fullLink;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      field.setSelectionRange(0, fullLink.length);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(field);
    }

    if (!ok) {
      setActionError('Could not copy automatically. Press and hold the link to copy it.');
      return;
    }

    setCopied(true);
    clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  }

  /* ---- loading / failure states ---- */

  if (loading) {
    return (
      <AdminLayout>
        <div className="detail-loading" role="status">
          <span className="detail-spinner" aria-hidden="true" />
          Loading shipment…
        </div>
      </AdminLayout>
    );
  }

  if (!shipment) {
    return (
      <AdminLayout>
        <div className="detail-state">
          <p className="detail-error" role="alert">{loadError || 'This shipment could not be found.'}</p>
          <div className="detail-state-actions">
            <button type="button" className="detail-push-btn" onClick={() => loadDetail()}>Try again</button>
            <Link to="/admin" className="detail-secondary-btn">Back to dashboard</Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ---- page ---- */

  return (
    <AdminLayout>
      <header className="detail-header">
        <div>
          <p className="detail-eyebrow">Shipment</p>
          <h1 className="detail-title">{shipment.trackingNumber}</h1>
        </div>
        <div className="detail-header-right">
          <StatusBadge status={shipment.currentStatus} />
          <button type="button" className="detail-secondary-btn" onClick={() => openPushModal('picked_up')}>Mark Picked Up</button>
          <button type="button" className="detail-push-btn" onClick={() => openPushModal()}>+ Push Update</button>
        </div>
      </header>

      {actionError && (
        <div className="detail-error" role="alert">
          <span>{actionError}</span>
          <button type="button" className="detail-error-close" onClick={() => setActionError(null)} aria-label="Dismiss message">✕</button>
        </div>
      )}

      <section className="detail-link-card">
        <div>
          <p className="detail-link-label">Client Tracking Link</p>
          <p className="detail-link-value">{window.location.origin}/track/{shipment.trackingLinkToken}</p>
        </div>
        <button type="button" className="detail-copy-btn" onClick={handleCopyLink}>{copied ? '✓ Copied' : 'Copy Link'}</button>
      </section>

      <section className="detail-summary">
        <div>
          <p className="detail-summary-label">Recipient</p>
          <p>{shipment.recipient?.fullName || '—'}</p>
        </div>
        <div>
          <p className="detail-summary-label">Route</p>
          <p>{shipment.origin?.city} → {shipment.destination?.city}</p>
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
              <button type="button" className="detail-date-save" onClick={handleSaveDate} disabled={savingDate}>
                {savingDate ? 'Saving…' : 'Save'}
              </button>
              <button type="button" className="detail-date-cancel" onClick={cancelEditingDate} disabled={savingDate} aria-label="Cancel editing the date">✕</button>
            </div>
          ) : (
            <div className="detail-date-row">
              <p>{formatDate(shipment.estimatedDeliveryDate)}</p>
              <button type="button" className="detail-toggle-btn" onClick={startEditingDate}>Edit</button>
            </div>
          )}
        </div>
        <div>
          <p className="detail-summary-label">Automated Tracking</p>
          <div className="detail-automation-row">
            <span className={shipment.isAutomatedTrackingEnabled ? 'detail-automation-on' : 'detail-automation-off'}>
              {shipment.isAutomatedTrackingEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button type="button" className="detail-toggle-btn" onClick={handleToggleAutomation} disabled={automationBusy}>
              {automationBusy
                ? 'Updating…'
                : shipment.isAutomatedTrackingEnabled ? 'Switch to Manual Only' : 'Re-enable Automation'}
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

      {pushOpen && (
        <EventFormModal
          title="Push Manual Update"
          form={pushForm}
          onPatch={patchPushForm}
          onSubmit={handlePushEvent}
          onClose={closePushModal}
          submitting={submitting}
          submitLabel="Push Update"
          submittingLabel="Pushing…"
          error={modalError}
        />
      )}

      {editForm && (
        <EventFormModal
          title="Edit Update"
          form={editForm}
          onPatch={patchEditForm}
          onSubmit={handleEditEvent}
          onClose={closeEditModal}
          submitting={submitting}
          submitLabel="Save Changes"
          submittingLabel="Saving…"
          error={modalError}
        />
      )}
    </AdminLayout>
  );
}

export default ShipmentDetailPage;