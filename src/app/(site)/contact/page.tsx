import { ContactForm } from '@/components/ContactForm';

export const metadata = { title: 'Plan Your Journey' };

export default function ContactPage() {
  return (
    <main className="contact-page">
      <div className="contact-copy">
        <p className="eyebrow">Plan your journey</p>
        <h1 className="contact-heading">Tell us what<br />moves you.</h1>
        <p>Share a little about the trip in your mind. A Sri Lanka travel designer will reply within one working day with thoughtful first ideas.</p>
      </div>
      <ContactForm />
    </main>
  );
}
