import Image from 'next/image';
import { Reveal } from '@/components/Reveal';

export const metadata = { title: 'Our Story' };

export default function AboutPage() {
  return (
    <main>
      <section className="page-hero">
        <Image src="/images/forest.jpg" alt="A path through the Sri Lankan forest" fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>Our story</span>
          <h1>Born from<br />belonging.</h1>
          <p>We started ReiseCeylon to share Sri Lanka with the care, nuance and humanity it deserves.</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>Why we exist</div>
        <Reveal>
          <blockquote>The best journeys do not make a place feel consumed. They make it feel understood.</blockquote>
          <p>Our team brings together local travel designers, hosts, naturalists and storytellers. We work with independent stays and responsible partners, choosing depth over volume and lasting relationships over quick transactions.</p>
        </Reveal>
      </section>
      <section className="content-section">
        <div className="highlight-grid">
          <Reveal className="highlight-card"><span>01</span><h3>Local, always</h3><p>Decisions are made here, with knowledge shaped by seasons and lived experience.</p></Reveal>
          <Reveal className="highlight-card"><span>02</span><h3>Less, but better</h3><p>We recommend fewer places and know them more deeply.</p></Reveal>
          <Reveal className="highlight-card"><span>03</span><h3>Care that travels</h3><p>Your journey should benefit the people and landscapes that make it possible.</p></Reveal>
        </div>
      </section>
    </main>
  );
}
