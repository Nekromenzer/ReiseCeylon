import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/Reveal';
import { getDestinations, getTours } from '@/sanity/site';

/* Destinations added in the studio after a build are rendered on first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map(({ slug }) => ({ slug }));
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  const destination = destinations.find((item) => item.slug === slug);
  if (!destination) notFound();

  return (
    <main>
      <section className="page-hero">
        <Image src={destination.image} alt={destination.imageAlt} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{destination.region} · Sri Lanka</span>
          <h1>{destination.name}</h1>
          <p>{destination.note}. A place best understood slowly, through early light, local stories and the paths between landmarks.</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>Why go</div>
        <Reveal>
          <blockquote>{destination.introHeading}</blockquote>
          <p>{destination.introCopy}</p>
        </Reveal>
      </section>
      {destination.highlights.length > 0 ? (
        <section className="content-section">
          <div className="highlight-grid">
            {destination.highlights.map((highlight, index) => (
              <Reveal className="highlight-card" key={highlight.title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{highlight.title}</h3>
                <p>{highlight.copy}</p>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
      {destination.goodToKnowHeading || destination.goodToKnowCopy ? (
        <section className="detail-intro">
          <div>Good to know</div>
          <Reveal>
            <blockquote>{destination.goodToKnowHeading}</blockquote>
            <p>{destination.goodToKnowCopy}</p>
            {tours.length > 0 ? (
              <Link href={`/tours/${tours[0].slug}`} className="text-link">See a journey through here <span>↗</span></Link>
            ) : null}
          </Reveal>
        </section>
      ) : null}
    </main>
  );
}
