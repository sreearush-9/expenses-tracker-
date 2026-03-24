import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="landing" id="landing-page">
      {/* Header */}
      <header className="landing__header">
        <div className="landing__header-inner">
          <h1 className="landing__brand">EXPENSE TRACKER</h1>
          <Link to="/login" className="landing__open-btn">Open App</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="landing__hero">
        <h2 className="landing__title">
          Track cash flow<br />
          with a cleaner<br />
          command center.
        </h2>
        <p className="landing__desc">
          Modern interface, instant updates, and no clutter. Login to
          add, edit, and review spending in one place.
        </p>
        <div className="landing__cta">
          <Link to="/register" className="landing__btn landing__btn--primary">Start Now</Link>
          <Link to="/login" className="landing__btn landing__btn--secondary">Login</Link>
        </div>
      </section>

      {/* Features */}
      <section className="landing__features">
        <div className="landing__feature-card">
          <h3>Fast Entry</h3>
          <p>Create and update expenses quickly with inline editing.</p>
        </div>
        <div className="landing__feature-card">
          <h3>Live Totals</h3>
          <p>Always see current total amount and number of entries.</p>
        </div>
        <div className="landing__feature-card">
          <h3>Secure Access</h3>
          <p>JWT-based auth keeps dashboard actions protected.</p>
        </div>
      </section>
    </div>
  );
};

export default Landing;
