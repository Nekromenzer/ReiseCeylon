'use client';

import { useState } from 'react';

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="contact-form">
        <div className="contact-success">
          <span>Thank you</span>
          <h2>Your journey has begun.</h2>
          <p>A ReiseCeylon travel designer will be in touch within one working day.</p>
          <button type="button" onClick={() => setSent(false)}>Send another enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-form">
      <form onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
        <label>Your name<input name="name" required placeholder="How should we address you?" /></label>
        <label>Email address<input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>When are you thinking?<input name="dates" placeholder="Month or approximate dates" /></label>
        <label>What are you drawn to?
          <select name="interest" defaultValue="">
            <option value="" disabled>Choose a feeling</option>
            <option>Nature and wildlife</option><option>Culture and food</option><option>Coast and quiet</option><option>A little of everything</option>
          </select>
        </label>
        <label>Tell us more<textarea name="message" placeholder="Who is travelling, your pace, and the moments you hope to find..." /></label>
        <button type="submit">Begin the conversation ↗</button>
      </form>
    </div>
  );
}
