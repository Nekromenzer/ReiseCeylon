import Link from 'next/link';
import { getContactDetails } from '@/sanity/site';

export async function Footer() {
  const contact = await getContactDetails();

  return (
    <footer className="footer">
      <div className="footer-lead">
        <p>Your story starts here.</p>
        <h2>Let Sri Lanka<br />surprise you.</h2>
        <div className="footer-action-row">
          <Link href="/contact" className="light-cta">Design my journey <span>↗</span></Link>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Reise<span>Ceylon</span></div>
          <p>Where Memories Find Home.</p>
        </div>
        <div><strong>Explore</strong><Link href="/destinations">Destinations</Link><Link href="/#experiences">Experiences</Link><Link href="/journeys">Plan your journey</Link></div>
        <div><strong>Company</strong><Link href="/about">Our story</Link><Link href="/blog">Journal</Link><Link href="/contact">Contact</Link></div>
        <div>
          <strong>Say hello</strong>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          {contact.phone ? <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a> : null}
          {contact.whatsapp ? (
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          ) : null}
          <span>{contact.location}</span>
          {contact.social.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
          ))}
        </div>
      </div>
      <div className="footer-bottom"><span>© 2026 ReiseCeylon</span><span>Made thoughtfully in Sri Lanka</span></div>
    </footer>
  );
}
