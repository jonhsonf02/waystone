import './ProgressBar.css';

const STEPS = ['order_created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
const STEP_LABELS = ['Order Created', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

function ProgressBar({ currentStatus }) {
  const isException = currentStatus === 'exception' || currentStatus === 'on_hold';
  const normalized = ['arrived_at_facility', 'departed_facility'].includes(currentStatus) ? 'in_transit' : currentStatus;
  const currentIndex = STEPS.indexOf(normalized);

  return (
    <div className="progress-bar">
      {STEPS.map((step, i) => {
        const reached = !isException && i <= currentIndex;
        return (
          <div className="progress-bar-step" key={step}>
            <div className={`progress-bar-dot ${reached ? 'progress-bar-dot--reached' : ''} ${isException ? 'progress-bar-dot--exception' : ''}`} />
            <span className="progress-bar-label">{STEP_LABELS[i]}</span>
            {i < STEPS.length - 1 && (
              <div className={`progress-bar-line ${reached && i < currentIndex ? 'progress-bar-line--reached' : ''}`} />
            )}
          </div>
        );
      })}
      {isException && <p className="progress-bar-exception-note">⚠ This shipment requires attention — see timeline below.</p>}
    </div>
  );
}

export default ProgressBar;