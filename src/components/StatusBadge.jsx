import './StatusBadge.css';

const STATUS_CONFIG = {
  order_created: { label: 'Order Created', var: '--status-created' },
  picked_up: { label: 'Picked Up', var: '--status-picked-up' },
  in_transit: { label: 'In Transit', var: '--status-in-transit' },
  arrived_at_facility: { label: 'At Facility', var: '--status-in-transit' },
  departed_facility: { label: 'Departed Facility', var: '--status-in-transit' },
  out_for_delivery: { label: 'Out for Delivery', var: '--status-out-for-delivery' },
  delivery_attempted: { label: 'Delivery Attempted', var: '--status-exception' },
  delivered: { label: 'Delivered', var: '--status-delivered' },
  exception: { label: 'Exception', var: '--status-exception' },
  on_hold: { label: 'On Hold', var: '--status-exception' },
};

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, var: '--status-created' };
  return (
    <span className="status-badge" style={{ backgroundColor: `var(${config.var})` }}>
      {config.label}
    </span>
  );
}

export default StatusBadge;