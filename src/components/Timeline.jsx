import StatusBadge from './StatusBadge.jsx';
import './Timeline.css';

const SOURCE_LABELS = { manual: 'Staff Update', automated: 'Live Tracking', system: 'System' };

function Timeline({ events, onEdit }) {
  return (
    <ul className="timeline">
      {events.map((event) => (
        <li className="timeline-item" key={event._id}>
          <div className="timeline-item-header">
            <StatusBadge status={event.status} />
            <span className="timeline-item-source">{SOURCE_LABELS[event.source] || event.source}</span>
            {onEdit && event.source === 'manual' && (
              <button className="timeline-item-edit" onClick={() => onEdit(event)}>Edit</button>
            )}
          </div>
          <p className="timeline-item-description">{event.description}</p>
          <p className="timeline-item-meta">
            {event.location?.city && `${event.location.city}${event.location.country ? ', ' + event.location.country : ''} · `}
            {new Date(event.timestamp).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default Timeline;