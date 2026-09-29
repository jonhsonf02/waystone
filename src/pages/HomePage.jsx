import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getShipmentByNumber } from '../api/client.js';
import { useInView } from '../hooks/useInView.js';
import { useAuth } from '../context/AuthContext.jsx';
import './HomePage.css';

const STEPS = [
  { num: '01', title: 'Create Shipment', text: 'Our team logs your package with a unique, secure tracking number.' },
  { num: '02', title: 'Track in Real Time', text: 'Live automated scans and staff updates land on one unified timeline.' },
  { num: '03', title: 'Confirm Delivery', text: 'Get notified the moment your package reaches its destination.' },
];

const FEATURES = [
  {
    color: 'blue',
    title: 'Live Automated Tracking',
    text: 'Automated status updates flow in as your package moves through our network — no manual refresh needed.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    ),
  },
  {
    color: 'amber',
    title: 'Staff Oversight',
    text: 'Every shipment is watched by real people — manual updates step in the moment something needs attention.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    color: 'green',
    title: 'Full Transparency',
    text: 'A complete, timestamped history from pickup to delivery — nothing hidden, nothing skipped.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
  {
    color: 'violet',
    title: 'Secure by Design',
    text: 'Every tracking link is a cryptographically random token — no guessable URLs, no exposed data.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    ),
  },
];

function RouteVisual() {
  return (
    <div className="route-visual">
      <svg viewBox="0 0 400 240" className="route-visual-svg">
        <path d="M30 200 Q120 40 200 120 T370 40" fill="none" stroke="var(--ws-slate-200)" strokeWidth="3" strokeDasharray="2 10" strokeLinecap="round" />
        <circle cx="30" cy="200" r="7" fill="var(--ws-navy-900)" />
        <circle cx="370" cy="40" r="7" fill="var(--ws-green-600)" />
        <circle className="route-visual-dot" r="6" fill="var(--ws-blue-600)">
          <animateMotion dur="4s" repeatCount="indefinite" path="M30 200 Q120 40 200 120 T370 40" />
        </circle>
      </svg>
      <div className="route-visual-card route-visual-card--1">
        <span className="route-visual-badge route-visual-badge--transit">In Transit</span>
        <p>WS-8851948764US</p>
      </div>
      <div className="route-visual-card route-visual-card--2">
        <span className="route-visual-badge route-visual-badge--delivered">Delivered</span>
        <p>Lagos → Austin</p>
      </div>
    </div>
  );
}

function HomePage() {
  const { user } = useAuth();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [stepsRef, stepsInView] = useInView();
  const [featuresRef, featuresInView] = useInView();
  const [ctaRef, ctaInView] = useInView();

  async function handleSearch(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await getShipmentByNumber(trackingNumber.trim());
      window.location.href = `/track/${res.shipment.trackingLinkToken}`;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="home-page">
      <header className="home-nav">
        <Link to="/" className="home-nav-brand">
          <img src="/images/waystone.png" alt="Waystone" className="home-nav-mark" />
          <span>Waystone</span>
        </Link>
        <nav className="home-nav-links">
          <a href="#how-it-works">How It Works</a>
          <a href="#features">Features</a>
        </nav>
        {user ? (
          <Link to="/admin" className="home-nav-signin">Dashboard</Link>
        ) : (
          <Link to="/login" className="home-nav-signin">Staff Sign In</Link>
        )}
      </header>

      <section className="home-hero">
        <div className="home-hero-text">
          <p className="home-hero-eyebrow">Package &amp; Asset Tracking</p>
          <h1 className="home-hero-title">Know exactly<br />where your shipment is.</h1>
          <p className="home-hero-subtitle">
            Real-time tracking that blends live automated scans with staff oversight —
            one unified timeline, zero guesswork.
          </p>

          <form className="home-search-card" onSubmit={handleSearch}>
            {error && <p className="home-search-error">{error}</p>}
            <div className="home-search-row">
              <input
                className="home-search-input"
                placeholder="Tracking number (e.g. WS-8851948764US)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                required
              />
              <button type="submit" className="home-search-btn" disabled={loading}>
                {loading ? 'Searching…' : 'Track'}
              </button>
            </div>
          </form>

          <div className="home-hero-trust">
            <span>Trusted for</span>
            <strong>Nigerian</strong> <span>&amp;</span> <strong>US</strong> <span>logistics</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <RouteVisual />
        </div>
      </section>

      <section className="home-stats">
        <div className="home-stat"><strong>99.9%</strong><span>Uptime</span></div>
        <div className="home-stat"><strong>&lt;2min</strong><span>Update Interval</span></div>
        <div className="home-stat"><strong>256-bit</strong><span>Link Security</span></div>
        <div className="home-stat"><strong>24/7</strong><span>Staff Monitoring</span></div>
      </section>

      <section id="how-it-works" className="home-steps" ref={stepsRef}>
        <p className="home-section-eyebrow">How It Works</p>
        <h2 className="home-section-title">From pickup to delivery, in three steps</h2>
        <div className={`home-steps-grid ${stepsInView ? 'is-visible' : ''}`}>
          {STEPS.map((step, i) => (
            <div className="home-step" key={step.num} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="home-step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
              {i < STEPS.length - 1 && <div className="home-step-connector" />}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="home-features" ref={featuresRef}>
        <p className="home-section-eyebrow">Why Waystone</p>
        <h2 className="home-section-title">Built to the standard of enterprise carriers</h2>
        <div className={`home-features-grid ${featuresInView ? 'is-visible' : ''}`}>
          {FEATURES.map((f, i) => (
            <div className="home-feature-card" key={f.title} style={{ transitionDelay: `${i * 0.08}s` }}>
              <div className={`home-feature-icon home-feature-icon--${f.color}`}>{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cta" ref={ctaRef}>
        <div className={`home-cta-card ${ctaInView ? 'is-visible' : ''}`}>
          <div>
            <h2>Manage shipments with confidence</h2>
            <p>Sign in to create shipments, push live updates, and monitor your entire fleet.</p>
          </div>
          {user ? (
            <Link to="/admin" className="home-cta-btn">Go to Dashboard →</Link>
          ) : (
            <Link to="/login" className="home-cta-btn">Staff Sign In →</Link>
          )}
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-grid">
          <div className="home-footer-brand">
            <Link to="/" className="home-nav-brand">
              <img src="/images/waystone.png" alt="Waystone" className="home-nav-mark" />
              <span>Waystone</span>
            </Link>
            <p>Reliable, transparent shipment tracking built for real logistics operations.</p>
          </div>
          <div className="home-footer-col">
            <h4>Product</h4>
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
          </div>
          <div className="home-footer-col">
            <h4>Company</h4>
            {user ? (
              <Link to="/admin">Dashboard</Link>
            ) : (
              <Link to="/login">Staff Sign In</Link>
            )}
          </div>
        </div>
        <div className="home-footer-bottom">
          <p>© 2026 Waystone. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;