import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { destinations, tours } from '@/lib/content';
import { Reveal } from '@/components/Reveal';

export function generateStaticParams() {
  return destinations.map(({ slug }) => ({ slug }));
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = destinations.find((item) => item.slug === slug);
  if (!destination) notFound();

  return (
    <main>
      <section className="page-hero">
        <Image src={destination.image} alt={destination.name} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{destination.region} · Sri Lanka</span>
          <h1>{destination.name}</h1>
          <p>{destination.note}. A place best understood slowly, through early light, local stories and the paths between landmarks.</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>Why go</div>
        <Reveal>
          <blockquote>Come for the landscape.<br />Stay for its quieter stories.</blockquote>
          <p>{destination.name} is more than a point on a map. We pair its essential landmarks with time to wander, meet people and notice the details that make a place memorable.</p>
        </Reveal>
      </section>
      <section className="content-section">
        <div className="highlight-grid">
          {[
            ['01', 'The essential view', 'Arrive before the day gathers pace and see the landscape in its softest light.'],
            ['02', 'A local table', 'Share seasonal food and conversation in a setting selected for character, not spectacle.'],
            ['03', 'Room to wander', 'A generous afternoon with a thoughtful route and no obligation to hurry.']
          ].map(([n, title, copy]) => <Reveal className="highlight-card" key={n}><span>{n}</span><h3>{title}</h3><p>{copy}</p></Reveal>)}
        </div>
      </section>
      <section className="detail-intro">
        <div>Good to know</div>
        <Reveal>
          <blockquote>Best from December to April, beautiful in every season.</blockquote>
          <p>We plan around weather, local festivals and your preferred pace. Private transfers, handpicked stays, trusted guides and 24/7 in-country support can all be woven into your journey.</p>
          <Link href={`/tours/${tours[0].slug}`} className="text-link">See a journey through here <span>↗</span></Link>
        </Reveal>
      </section>
    </main>
  );
}
