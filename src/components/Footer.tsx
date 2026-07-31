import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-lead">
        <p>Your story starts here.</p>
        <h2>Let Sri Lanka<br />surprise you.</h2>
        <div className="footer-action-row">
          <Link href="/contact" className="light-cta">Design my journey <span>↗</span></Link>
          <a href="mailto:journeys@reiseceylon.com">journeys@reiseceylon.com</a>
        </div>
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Reise<span>Ceylon</span></div>
          <p>Where Memories Find Home.</p>
        </div>
        <div><strong>Explore</strong><Link href="/#destinations">Destinations</Link><Link href="/#experiences">Experiences</Link><Link href="/#journeys">Journeys</Link></div>
        <div><strong>Company</strong><Link href="/about">Our story</Link><Link href="/blog">Journal</Link><Link href="/contact">Contact</Link></div>
        <div><strong>Say hello</strong><a href="mailto:journeys@reiseceylon.com">journeys@reiseceylon.com</a><span>Colombo, Sri Lanka</span></div>
      </div>
      <div className="footer-bottom"><span>© 2026 ReiseCeylon</span><span>Made thoughtfully in Sri Lanka</span></div>
    </footer>
  );
}
