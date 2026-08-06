import { ContactForm } from '@/components/ContactForm';
import { getContactDetails } from '@/sanity/site';

export const metadata = { title: 'Plan Your Journey' };

export default async function ContactPage() {
  const contact = await getContactDetails();

  return (
    <main className="contact-page">
      <div className="contact-copy">
        <p className="eyebrow">Plan your journey</p>
        <h1 className="contact-heading">Tell us what<br />moves you.</h1>
        <p>Share a little about the trip in your mind. A Sri Lanka travel designer will reply {contact.responseTime} with thoughtful first ideas.</p>
        <div className="contact-details">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          {contact.phone ? <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a> : null}
          {contact.whatsapp ? (
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">Message on WhatsApp</a>
          ) : null}
          <span>{contact.address ?? contact.location}</span>
        </div>
      </div>
      <ContactForm />
    </main>
  );
}
