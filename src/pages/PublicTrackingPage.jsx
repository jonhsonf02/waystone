import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShipmentByToken } from '../api/client.js';
import { useSocket } from '../hooks/useSocket.js';
import StatusBadge from '../components/StatusBadge.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import RouteMap from '../components/RouteMap.jsx';
import Timeline from '../components/Timeline.jsx';
import LoadingState from '../components/LoadingState.jsx';
import './PublicTrackingPage.css';

function PublicTrackingPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    setLoading(true);
    getShipmentByToken(token)
      .then((res) => setData(res))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  useSocket(data?.shipment?.trackingNumber, (payload) => {
    setData((prev) => {
      if (!prev) return prev;
      const alreadyExists = prev.events.some((e) => e._id === payload.event._id);
      if (alreadyExists) return prev;
      return { shipment: payload.shipment, events: [payload.event, ...prev.events] };
    });
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 2000);
  });

  if (loading) return <LoadingState />;
  if (error) return <div className="tracking-page-state tracking-page-state--error">{error}</div>;

  const { shipment, events } = data;
  const latestEvent = events[0];
  const currentLocation = latestEvent?.location?.city
    ? `${latestEvent.location.city}${latestEvent.location.country ? ', ' + latestEvent.location.country : ''}`
    : '—';

  return (
    <div className="tracking-page">
      <div className={`tracking-page-card ${justUpdated ? 'tracking-page-card--pulse' : ''}`}>
        <header className="tracking-page-header">
          <div>
            <p className="tracking-page-eyebrow">Tracking Number</p>
            <h1 className="tracking-page-number">{shipment.trackingNumber}</h1>
            <p className="tracking-page-order-date">
              Order placed {new Date(shipment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <StatusBadge status={shipment.currentStatus} />
        </header>

        {justUpdated && <p className="tracking-page-live-note">● Live update received</p>}

        {shipment.estimatedDeliveryDate && (
          <p className="tracking-page-eta">
            Estimated delivery: <strong>{new Date(shipment.estimatedDeliveryDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
          </p>
        )}

        <ProgressBar currentStatus={shipment.currentStatus} />

        <RouteMap shipment={shipment} />

        <div className="tracking-page-current-location">
          <span className="tracking-page-current-location-label">Current Location</span>
          <span className="tracking-page-current-location-value">📍 {currentLocation}</span>
        </div>

        {shipment.waypoints?.length > 0 && (
          <div className="tracking-page-route">
            <p className="tracking-page-summary-label">Planned Route</p>
            <div className="tracking-page-route-chips">
              <span className="tracking-page-route-chip tracking-page-route-chip--origin">{shipment.origin.city}</span>
              {shipment.waypoints.map((wp, i) => (
                <span className="tracking-page-route-chip" key={i}>{wp.city}</span>
              ))}
              <span className="tracking-page-route-chip tracking-page-route-chip--dest">{shipment.destination.city}</span>
            </div>
          </div>
        )}

        <section className="tracking-page-summary">
          <div>
            <p className="tracking-page-summary-label">From</p>
            <p>{shipment.origin.city}, {shipment.origin.country}</p>
          </div>
          <div>
            <p className="tracking-page-summary-label">To</p>
            <p>{shipment.destination.city}, {shipment.destination.country}</p>
          </div>
          <div>
            <p className="tracking-page-summary-label">Recipient</p>
            <p>{shipment.recipient.fullName}</p>
          </div>
        </section>

        <section className="tracking-page-contents">
          <p className="tracking-page-summary-label">What's Inside</p>
          <p className="tracking-page-contents-text">{shipment.description}</p>
        </section>

        <h2 className="tracking-page-timeline-title">Tracking History</h2>
        <Timeline events={events} />
      </div>
    </div>
  );
}

export default PublicTrackingPage;