import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { tours } from '@/lib/content';
import { Reveal } from '@/components/Reveal';

export function generateStaticParams() {
  return tours.map(({ slug }) => ({ slug }));
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tour = tours.find((item) => item.slug === slug);
  if (!tour) notFound();

  const days = [
    ['Days 1–3', 'Begin in the old kingdoms', 'Arrive gently, settle into the island and follow ancient paths through forest and stone.'],
    ['Days 4–7', 'Move with the hills', 'Take the slow train into tea country, walk the estates and dine by the fire as mist gathers.'],
    ['Days 8–10', 'Follow the road south', 'Trade mountain air for the coast, stopping at makers, markets and a secluded stay by the sea.'],
    ['Days 11–12', 'End without hurrying', 'Leave the final days open for saltwater, long lunches and one last Sri Lankan sunset.']
  ];

  return (
    <main>
      <section className="page-hero">
        <Image src={tour.image} alt={tour.title} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{tour.days} · Private journey · {tour.price}</span>
          <h1>{tour.title}</h1>
          <p>{tour.route}. A considered journey balancing cultural depth, open landscapes and enough unscripted time to make it yours.</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>The journey</div>
        <Reveal>
          <blockquote>A route with direction,<br />never a rigid schedule.</blockquote>
          <p>Every stay, transfer and encounter is handled. The rhythm remains spacious, and every detail can be changed around your interests.</p>
        </Reveal>
      </section>
      <section className="content-section">
        <h2 className="content-heading">How the story unfolds.</h2>
        <div className="timeline">
          {days.map(([time, title, copy]) => <Reveal className="timeline-item" key={time}><span>{time}</span><div><h3>{title}</h3><p>{copy}</p></div></Reveal>)}
        </div>
      </section>
      <section className="detail-intro">
        <div>Included</div>
        <Reveal>
          <blockquote>Private by design.<br />Supported throughout.</blockquote>
          <p>Handpicked accommodation, daily breakfast, private transport, specialist hosts, selected experiences and 24/7 local assistance are included. International flights and travel insurance are excluded.</p>
          <Link href="/contact" className="dark-cta">Tailor this journey <span>↗</span></Link>
        </Reveal>
      </section>
    </main>
  );
}
