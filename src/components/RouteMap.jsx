import { useMemo } from 'react';
import './RouteMap.css';

const PROGRESSION = [
  'order_created', 'picked_up', 'in_transit', 'arrived_at_facility',
  'departed_facility', 'out_for_delivery', 'delivered',
];

const ROUTE_PATH = 'M40 90 Q 200 20 300 60 T 560 30';

function computePercent(status) {
  if (status === 'exception' || status === 'on_hold') return null;
  const idx = PROGRESSION.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (PROGRESSION.length - 1)) * 100);
}

function RouteMap({ shipment }) {
  const percent = computePercent(shipment.currentStatus);
  const isException = percent === null;

  const stops = useMemo(() => {
    const mid = shipment.waypoints || [];
    return [
      { label: shipment.origin.city, type: 'origin' },
      ...mid.map((w) => ({ label: w.city, type: 'stop' })),
      { label: shipment.destination.city, type: 'dest' },
    ];
  }, [shipment]);

  return (
    <div className="route-map">
      <p className="route-map-label">Live Route</p>
      <div className="route-map-track">
        <svg viewBox="0 0 600 120" className="route-map-svg" preserveAspectRatio="none">
          <path d={ROUTE_PATH} fill="none" stroke="var(--ws-slate-200)" strokeWidth="4" strokeDasharray="1 12" strokeLinecap="round" />
          {!isException && (
            <path
              d={ROUTE_PATH}
              fill="none"
              stroke="var(--ws-blue-600)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                strokeDasharray: 700,
                strokeDashoffset: 700 - (700 * percent) / 100,
                transition: 'stroke-dashoffset 1.2s ease',
              }}
            />
          )}
        </svg>

        {!isException && (
          <div className="route-map-vehicle" style={{ offsetDistance: `${percent}%` }}>
            <div className="route-map-vehicle-icon">🚚</div>
          </div>
        )}

        <div className="route-map-stops">
          {stops.map((s, i) => (
            <div className="route-map-stop" key={i} style={{ left: `${(i / (stops.length - 1)) * 100}%` }}>
              <span className={`route-map-dot route-map-dot--${s.type}`} />
              <span className="route-map-stop-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {isException ? (
        <p className="route-map-exception">⚠ Movement paused — shipment needs attention</p>
      ) : (
        <p className="route-map-percent">{percent}% of the way there</p>
      )}
    </div>
  );
}

export default RouteMap;