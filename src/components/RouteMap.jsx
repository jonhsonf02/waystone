import { useEffect, useMemo, useRef, useState } from 'react';
import './RouteMap.css';

const PROGRESSION = [
  'order_created', 'picked_up', 'in_transit', 'arrived_at_facility',
  'departed_facility', 'out_for_delivery', 'delivered',
];

const ROUTE_PATH = 'M40 90 Q 200 20 300 60 T 560 30';
const VIEW_WIDTH = 600;

function computePercent(status) {
  if (status === 'exception' || status === 'on_hold') return null;
  const idx = PROGRESSION.indexOf(status);
  if (idx === -1) return 0;
  return Math.round((idx / (PROGRESSION.length - 1)) * 100);
}

function RouteMap({ shipment }) {
  const percent = computePercent(shipment.currentStatus);
  const isException = percent === null;

  const pathRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState({ x: 40, y: 90 });

  // Wait one frame so the trail and the truck animate in on first load.
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Find the exact point on the curve for the current progress.
  useEffect(() => {
    if (!ready || isException || !pathRef.current) return;
    const path = pathRef.current;
    const point = path.getPointAtLength((path.getTotalLength() * percent) / 100);
    setPos({ x: point.x, y: point.y });
  }, [ready, percent, isException]);

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
          <path
            ref={pathRef}
            d={ROUTE_PATH}
            fill="none"
            stroke="var(--ws-slate-200)"
            strokeWidth="4"
            strokeDasharray="1 12"
            strokeLinecap="round"
          />
          {!isException && percent > 0 && (
            <path
              d={ROUTE_PATH}
              pathLength="100"
              fill="none"
              stroke="var(--ws-blue-600)"
              strokeWidth="4"
              strokeLinecap="round"
              style={{
                strokeDasharray: 100,
                strokeDashoffset: ready ? 100 - percent : 100,
                transition: 'stroke-dashoffset 1.2s ease',
              }}
            />
          )}
        </svg>

        {!isException && (
          <div
            className="route-map-vehicle"
            style={{ left: `${(pos.x / VIEW_WIDTH) * 100}%`, top: `${pos.y}px` }}
          >
            <div className="route-map-vehicle-icon">🚚</div>
          </div>
        )}

        <div className="route-map-stops">
          {stops.map((s, i) => (
            <div className="route-map-stop" key={i} style={{ left: `${(i / (stops.length - 1)) * 100}%` }}>
              <span className={`route-map-dot route-map-dot--${s.type}`} />
              <span className="route-map-stop-label" title={s.label}>{s.label}</span>
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