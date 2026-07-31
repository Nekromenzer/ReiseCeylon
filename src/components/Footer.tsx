import Link from 'next/link';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-lead">
        <p>Begin with a feeling.</p>
        <h2>Let the island<br />find its way to you.</h2>
        <Link href="/contact" className="light-cta">Design my journey <span>↗</span></Link>
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
