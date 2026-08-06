import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Reveal } from '@/components/Reveal';
import { getTours } from '@/sanity/site';

/* Journeys added in the studio after a build are rendered on first request. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const tours = await getTours();
  return tours.map(({ slug }) => ({ slug }));
}

export default async function TourPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tours = await getTours();
  const tour = tours.find((item) => item.slug === slug);
  if (!tour) notFound();

  return (
    <main>
      <section className="page-hero">
        <Image src={tour.image} alt={tour.imageAlt} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{tour.days} · Private journey · Airport to airport</span>
          <h1>{tour.title}</h1>
          <p>{tour.route}. A considered journey balancing cultural depth, open landscapes and enough unscripted time to make it yours.</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>The journey</div>
        <Reveal>
          <blockquote>{tour.introHeading}</blockquote>
          <p>{tour.introCopy}</p>
        </Reveal>
      </section>
      {tour.itinerary.length > 0 ? (
        <section className="content-section">
          <h2 className="content-heading">How the story unfolds.</h2>
          <div className="timeline">
            {tour.itinerary.map((stage) => (
              <Reveal className="timeline-item" key={`${stage.period}-${stage.title}`}>
                <span>{stage.period}</span>
                <div><h3>{stage.title}</h3><p>{stage.copy}</p></div>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}
      {tour.includedHeading || tour.includedCopy ? (
        <section className="detail-intro">
          <div>Included</div>
          <Reveal>
            <blockquote>{tour.includedHeading}</blockquote>
            <p>{tour.includedCopy}</p>
            <Link href="/contact" className="dark-cta">Tailor this journey <span>↗</span></Link>
          </Reveal>
        </section>
      ) : null}
    </main>
  );
}
