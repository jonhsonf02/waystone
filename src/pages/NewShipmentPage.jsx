import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createShipment } from '../api/adminClient.js';
import AdminLayout from '../components/AdminLayout.jsx';
import { US_STATES, STATE_CITIES, COUNTRIES } from '../data/usLocations.js';
import './NewShipmentPage.css';

const ITEM_TYPES = ['package', 'card', 'atm_card', 'document', 'money', 'other'];

async function geocodeLocation(query) {
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (!data[0]) throw new Error('No matching location found — enter coordinates manually.');
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

function AddressFields({ prefix, form, update }) {
  const stateVal = form[`${prefix}State`];
  const citySuggestions = STATE_CITIES[stateVal] || [];

  return (
    <>
      <div className="form-grid form-grid--2">
        <label className="form-label">Street
          <input className="form-input" value={form[`${prefix}Street`]} onChange={(e) => update(`${prefix}Street`, e.target.value)} required />
        </label>
        <label className="form-label">City
          <input
            className="form-input"
            list={`${prefix}-city-list`}
            value={form[`${prefix}City`]}
            onChange={(e) => update(`${prefix}City`, e.target.value)}
            placeholder={citySuggestions.length ? 'Start typing or pick a suggestion' : ''}
            required
          />
          <datalist id={`${prefix}-city-list`}>
            {citySuggestions.map((c) => <option key={c} value={c} />)}
          </datalist>
        </label>
      </div>
      <div className="form-grid form-grid--4">
        <label className="form-label">State
          <select className="form-input" value={stateVal} onChange={(e) => update(`${prefix}State`, e.target.value)} required>
            <option value="">Select state…</option>
            {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </select>
        </label>
        <label className="form-label">Zip
          <input className="form-input" value={form[`${prefix}Zip`]} onChange={(e) => update(`${prefix}Zip`, e.target.value)} required />
        </label>
        <label className="form-label" style={{ gridColumn: 'span 2' }}>Country
          <select className="form-input" value={form[`${prefix}Country`]} onChange={(e) => update(`${prefix}Country`, e.target.value)} required>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
    </>
  );
}

function NewShipmentPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);

  const [form, setForm] = useState({
    itemType: 'package',
    description: '',
    weight: '',
    estimatedDeliveryDate: '',
    recipientName: '',
    recipientEmail: '',
    recipientPhone: '',
    recipientStreet: '',
    recipientCity: '',
    recipientState: '',
    recipientZip: '',
    recipientCountry: 'United States',
    originStreet: '',
    originCity: '',
    originState: '',
    originZip: '',
    originCountry: 'United States',
    originLat: '',
    originLng: '',
    destStreet: '',
    destCity: '',
    destState: '',
    destZip: '',
    destCountry: 'United States',
  });

  const [waypoints, setWaypoints] = useState([]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function addWaypoint() {
    setWaypoints((w) => [...w, { label: '', city: '', state: '', country: 'United States' }]);
  }

  function updateWaypoint(index, field, value) {
    setWaypoints((w) => w.map((wp, i) => (i === index ? { ...wp, [field]: value } : wp)));
  }

  function removeWaypoint(index) {
    setWaypoints((w) => w.filter((_, i) => i !== index));
  }

  async function handleFindOriginCoordinates() {
    const query = [form.originCity, form.originState, form.originCountry].filter(Boolean).join(', ');
    if (!form.originCity.trim()) {
      setError('Enter an origin city first, then find coordinates.');
      return;
    }
    setGeocoding(true);
    setError(null);
    try {
      const { lat, lng } = await geocodeLocation(query);
      update('originLat', lat.toFixed(6));
      update('originLng', lng.toFixed(6));
    } catch (err) {
      setError(err.message);
    } finally {
      setGeocoding(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const stateNameFor = (code) => US_STATES.find((s) => s.code === code)?.name || code;

    const payload = {
      itemType: form.itemType,
      description: form.description,
      weight: form.weight ? parseFloat(form.weight) : undefined,
      estimatedDeliveryDate: form.estimatedDeliveryDate || undefined,
      waypoints: waypoints.filter((w) => w.city.trim()),
      recipient: {
        fullName: form.recipientName,
        email: form.recipientEmail,
        phone: form.recipientPhone,
        address: {
          street: form.recipientStreet,
          city: form.recipientCity,
          state: stateNameFor(form.recipientState),
          zip: form.recipientZip,
          country: form.recipientCountry,
        },
      },
      origin: {
        street: form.originStreet,
        city: form.originCity,
        state: stateNameFor(form.originState),
        zip: form.originZip,
        country: form.originCountry,
        lat: form.originLat ? parseFloat(form.originLat) : undefined,
        lng: form.originLng ? parseFloat(form.originLng) : undefined,
      },
      destination: {
        street: form.destStreet,
        city: form.destCity,
        state: stateNameFor(form.destState),
        zip: form.destZip,
        country: form.destCountry,
      },
    };

    try {
      const result = await createShipment(auth, payload);
      navigate(`/admin/shipments/${result.shipment._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminLayout>
      <header className="new-shipment-header">
        <h1 className="new-shipment-title">New Shipment</h1>
        <p className="new-shipment-subtitle">Create a shipment and generate its tracking link</p>
      </header>

      {error && <p className="new-shipment-error">{error}</p>}

      <form className="new-shipment-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <h2 className="form-section-title">Item Details</h2>
          <div className="form-grid form-grid--2">
            <label className="form-label">
              Item Type
              <select className="form-input" value={form.itemType} onChange={(e) => update('itemType', e.target.value)}>
                {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </label>
            <label className="form-label">
              Weight (kg)
              <input className="form-input" type="number" step="0.01" value={form.weight} onChange={(e) => update('weight', e.target.value)} />
            </label>
          </div>
          <div className="form-grid form-grid--2">
            <label className="form-label">
              Description
              <input className="form-input" value={form.description} onChange={(e) => update('description', e.target.value)} required />
            </label>
            <label className="form-label">
              Estimated Delivery Date
              <input className="form-input" type="date" value={form.estimatedDeliveryDate} onChange={(e) => update('estimatedDeliveryDate', e.target.value)} />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Recipient</h2>
          <div className="form-grid form-grid--2">
            <label className="form-label">Full Name
              <input className="form-input" value={form.recipientName} onChange={(e) => update('recipientName', e.target.value)} required />
            </label>
            <label className="form-label">Email
              <input className="form-input" type="email" value={form.recipientEmail} onChange={(e) => update('recipientEmail', e.target.value)} required />
            </label>
          </div>
          <div className="form-grid form-grid--2">
            <label className="form-label">Phone
              <input className="form-input" value={form.recipientPhone} onChange={(e) => update('recipientPhone', e.target.value)} required />
            </label>
          </div>
          <AddressFields prefix="recipient" form={form} update={update} />
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Origin</h2>
          <p className="form-section-hint">
            This is where the package starts — its coordinates power the live map the client sees from the moment this shipment is created.
          </p>
          <AddressFields prefix="origin" form={form} update={update} />

          <button type="button" className="geocode-btn" onClick={handleFindOriginCoordinates} disabled={geocoding}>
            {geocoding ? 'Finding…' : '📍 Find Coordinates on Map'}
          </button>

          <div className="latlng-row">
            <label className="form-label">
              Latitude
              <input className="form-input" value={form.originLat} onChange={(e) => update('originLat', e.target.value)} placeholder="e.g. 38.9072" />
            </label>
            <label className="form-label">
              Longitude
              <input className="form-input" value={form.originLng} onChange={(e) => update('originLng', e.target.value)} placeholder="e.g. -77.0369" />
            </label>
          </div>
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Destination</h2>
          <AddressFields prefix="dest" form={form} update={update} />
        </section>

        <section className="form-section">
          <h2 className="form-section-title">Planned Stopovers (optional)</h2>
          <p className="form-section-hint">
            Add stops the client will see on their tracking page as the planned route —
            e.g. a sorting facility or customs checkpoint the package will pass through.
          </p>
          {waypoints.map((wp, i) => (
            <div className="waypoint-row" key={i}>
              <input
                className="form-input"
                placeholder="Label (e.g. Regional Hub)"
                value={wp.label}
                onChange={(e) => updateWaypoint(i, 'label', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="City"
                value={wp.city}
                onChange={(e) => updateWaypoint(i, 'city', e.target.value)}
              />
              <input
                className="form-input"
                placeholder="State"
                value={wp.state}
                onChange={(e) => updateWaypoint(i, 'state', e.target.value)}
              />
              <button type="button" className="waypoint-remove" onClick={() => removeWaypoint(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="waypoint-add" onClick={addWaypoint}>+ Add Stopover</button>
        </section>

        <button type="submit" className="new-shipment-submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create Shipment'}
        </button>
      </form>
    </AdminLayout>
  );
}

export default NewShipmentPage;