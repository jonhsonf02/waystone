import './LoadingState.css';

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-card">
        <div className="loading-skeleton loading-skeleton--title" />
        <div className="loading-skeleton loading-skeleton--bar" />
        <div className="loading-skeleton loading-skeleton--line" />
        <div className="loading-skeleton loading-skeleton--line" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

export default LoadingState;