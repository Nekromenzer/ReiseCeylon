'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { destinations, experiences, tours } from '@/lib/content';
import { SearchJourney } from './SearchJourney';
import { Reveal } from './Reveal';

const testimonials = [
  {
    quote: 'They understood the trip we wanted before we knew how to describe it. Sri Lanka felt intimate, surprising and completely our own.',
    name: 'Maya & Theo',
    origin: 'Copenhagen'
  },
  {
    quote: 'Every transition felt effortless. The people we met—not just the places—became the story we still tell.',
    name: 'Amelia R.',
    origin: 'Melbourne'
  }
];

export function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0.28]);
  const [activeExperience, setActiveExperience] = useState(0);
  const [activeQuote, setActiveQuote] = useState(0);
  const [mapPlace, setMapPlace] = useState('Kandy');
  const [storyOpen, setStoryOpen] = useState(false);

  return (
    <main className="overflow-page">
      <section className="hero" ref={heroRef}>
        <motion.div className="hero-media" style={{ scale: heroScale, opacity: heroOpacity }}>
          <Image src="/images/sigiriya.jpg" alt="Sigiriya rising above Sri Lanka's forest canopy" fill priority sizes="100vw" />
        </motion.div>
        <div className="hero-wash" />
        <div className="hero-content">
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            Private journeys across Sri Lanka
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 48 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}>
            Discover the soul<br />of Sri Lanka.
          </motion.h1>
          <motion.div className="hero-actions" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.65 }}>
            <Link href="#destinations" className="gold-cta">Explore the island <span>↘</span></Link>
            <button type="button" className="story-button" onClick={() => setStoryOpen(true)}><i>▶</i> Watch our story</button>
          </motion.div>
        </div>
        <motion.div className="hero-search" initial={{ opacity: 0, y: 34 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.9 }}>
          <SearchJourney />
        </motion.div>
        <div className="scroll-cue"><span /> Scroll to wander</div>
      </section>
      {storyOpen && (
        <motion.div className="story-modal" role="dialog" aria-modal="true" aria-label="The ReiseCeylon story" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button type="button" className="story-close" onClick={() => setStoryOpen(false)} aria-label="Close story">×</button>
          <div className="story-frame">
            <Image src="/images/tea.jpg" alt="Sri Lanka tea country" fill sizes="100vw" />
            <div className="card-shade" />
            <div><p>Where memories find home</p><h2>Travel slowly.<br />Meet the island deeply.</h2><Link href="/about" onClick={() => setStoryOpen(false)}>Our story ↗</Link></div>
          </div>
        </motion.div>
      )}

      <section className="intro-section">
        <Reveal className="intro-copy">
          <p className="eyebrow">An island, felt deeply</p>
          <h2>Travel at the pace of<br /><em>curiosity.</em></h2>
          <p className="intro-body">We shape intimate journeys through Sri Lanka—guided by local knowledge, thoughtful stays and moments that could never fit inside an itinerary.</p>
        </Reveal>
        <Reveal className="intro-image" delay={0.15}>
          <Image src="/images/tea.jpg" alt="Sri Lanka's green tea country" fill sizes="(max-width: 768px) 100vw, 42vw" />
          <span>Central Highlands<br />6°56′ N, 80°47′ E</span>
        </Reveal>
      </section>

      <section className="destinations-section" id="destinations">
        <Reveal className="section-heading-row">
          <div><p className="eyebrow">Places that stay with you</p><h2>Follow what<br />moves you.</h2></div>
          <p>From cloud-soft highlands to old kingdoms and salt-air villages—choose a feeling, and we’ll take you there.</p>
        </Reveal>
        <div className="destination-grid">
          {destinations.map((destination, index) => (
            <Reveal className={`destination-card destination-${index + 1}`} key={destination.name} delay={index * 0.06}>
              <Link href={`/destinations/${destination.slug}`}>
                <Image src={destination.image} alt={destination.name} fill sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="card-shade" />
                <div className="destination-copy">
                  <span>{destination.region}</span>
                  <h3>{destination.name}</h3>
                  <p>{destination.note}</p>
                </div>
                <i>↗</i>
              </Link>
            </Reveal>
          ))}
        </div>
        <Link className="text-link" href="/destinations/sigiriya">Explore all destinations <span>↗</span></Link>
      </section>

      <section className="experience-section" id="experiences">
        <div className="experience-sticky">
          <p className="eyebrow">Choose your rhythm</p>
          <h2>Not things to do.<br /><em>Ways to feel.</em></h2>
          <p>Each experience is built around people who know the island by heart.</p>
          <div className="experience-index">0{activeExperience + 1} <span>/ 04</span></div>
        </div>
        <div className="experience-accordion">
          {experiences.map((experience, index) => (
            <button
              type="button"
              key={experience.name}
              className={activeExperience === index ? 'experience-panel active-panel' : 'experience-panel'}
              onMouseEnter={() => setActiveExperience(index)}
              onFocus={() => setActiveExperience(index)}
              onClick={() => setActiveExperience(index)}
            >
              <Image src={experience.image} alt="" fill sizes="(max-width: 768px) 100vw, 55vw" />
              <div className="card-shade" />
              <span>0{index + 1}</span>
              <div><h3>{experience.name}</h3><p>{experience.copy}</p></div>
            </button>
          ))}
        </div>
      </section>

      <section className="difference-section">
        <Reveal>
          <p className="eyebrow">The ReiseCeylon difference</p>
          <h2>Considered in every detail.<br />Human at every turn.</h2>
        </Reveal>
        <div className="promise-grid">
          {[
            ['01', 'Made around you', 'No fixed packages. Every route begins with how you want to feel and travel.'],
            ['02', 'Rooted here', 'Our local hosts open doors to places, stories and tables most travellers miss.'],
            ['03', 'Quietly exceptional', 'Beautiful stays, seamless pacing and support that is present without hovering.']
          ].map(([number, title, copy]) => (
            <Reveal className="promise" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></Reveal>
          ))}
        </div>
      </section>

      <section className="journey-section" id="journeys">
        <Reveal className="section-heading-row">
          <div><p className="eyebrow">Journeys to begin with</p><h2>Stories already<br />taking shape.</h2></div>
          <p>Use these as inspiration. Then let us reshape every day around you.</p>
        </Reveal>
        <div className="tour-list">
          {tours.map((tour, index) => (
            <Reveal className="tour-card" key={tour.title} delay={index * 0.08}>
              <Link href={`/tours/${tour.slug}`}>
                <div className="tour-image"><Image src={tour.image} alt="" fill sizes="(max-width: 768px) 100vw, 38vw" /></div>
                <div className="tour-copy"><span>{tour.days}</span><h3>{tour.title}</h3><p>{tour.route}</p><div><strong>{tour.price}</strong><i>View journey ↗</i></div></div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="map-section">
        <Reveal className="map-copy">
          <p className="eyebrow">One island, many worlds</p>
          <h2>Closer than<br />you imagine.</h2>
          <p>Wake among tea fields, lunch beside an ancient lake and reach the ocean by sunset. Tap the map to trace a possibility.</p>
          <Link href="/contact" className="dark-cta">Build my route <span>↗</span></Link>
        </Reveal>
        <Reveal className="map-art" delay={0.1}>
          <svg viewBox="0 0 420 650" role="img" aria-label="Interactive illustrated map of Sri Lanka">
            <path className="island-path" d="M217 21C166 68 130 125 118 181c-15 72 18 99-2 164-15 49-55 83-42 131 13 49 70 62 97 104 18 28 24 53 52 47 32-7 35-55 61-90 34-45 77-72 79-132 2-53-34-84-41-136-8-60 16-98-12-151-20-38-57-70-93-97Z" />
            <path className="route-path" d="M195 124C247 161 178 230 239 279s-53 94 2 146-33 83-19 146" />
            {[
              ['Sigiriya', 194, 125],
              ['Kandy', 238, 278],
              ['Ella', 184, 371],
              ['Yala', 247, 477],
              ['Galle', 142, 548]
            ].map(([place, x, y]) => (
              <g key={place as string} className={mapPlace === place ? 'map-point selected-point' : 'map-point'} onClick={() => setMapPlace(place as string)} role="button" tabIndex={0}>
                <circle cx={x as number} cy={y as number} r="10" />
                <text x={(x as number) + 18} y={(y as number) + 5}>{place}</text>
              </g>
            ))}
          </svg>
          <div className="map-caption"><span>Now exploring</span><strong>{mapPlace}</strong><p>Curated stays · local encounters · private transfers</p></div>
        </Reveal>
      </section>

      <section className="testimonial-section">
        <p className="eyebrow">Notes from the road</p>
        <div className="quote-mark">“</div>
        <motion.blockquote key={activeQuote} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65 }}>
          {testimonials[activeQuote].quote}
        </motion.blockquote>
        <div className="quote-controls">
          <div><strong>{testimonials[activeQuote].name}</strong><span>{testimonials[activeQuote].origin}</span></div>
          <div><button onClick={() => setActiveQuote((activeQuote + testimonials.length - 1) % testimonials.length)} aria-label="Previous testimonial">←</button><button onClick={() => setActiveQuote((activeQuote + 1) % testimonials.length)} aria-label="Next testimonial">→</button></div>
        </div>
      </section>

      <section className="journal-section">
        <Reveal className="section-heading-row">
          <div><p className="eyebrow">Field notes</p><h2>Stories for the<br />curious traveller.</h2></div>
          <Link href="/blog" className="text-link">Read the journal <span>↗</span></Link>
        </Reveal>
        <div className="journal-grid">
          <Reveal className="journal-feature">
            <Link href="/blog"><Image src="/images/galle.jpg" alt="Galle coast" fill sizes="(max-width: 768px) 100vw, 58vw" /><div className="card-shade" /><div><span>Coast · 8 min read</span><h3>A slow guide to Sri Lanka’s southern edge</h3></div></Link>
          </Reveal>
          <div className="journal-side">
            <Reveal><Link href="/blog"><Image src="/images/tea.jpg" alt="" width={260} height={190} /><div><span>Food & culture</span><h3>The hands behind a perfect cup of Ceylon tea</h3></div></Link></Reveal>
            <Reveal><Link href="/blog"><Image src="/images/yala.jpg" alt="" width={260} height={190} /><div><span>Wildlife</span><h3>Why the quietest safari is often the best one</h3></div></Link></Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
