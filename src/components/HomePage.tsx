'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import {
  art,
  destinations,
  experienceDetail,
  heroPlates,
  island,
  journeyNotes,
  manifestoStats,
  routeLine,
  ticker,
  tours,
  voices,
  waypoints
} from '@/lib/content';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const manifestoLead = 'We plan the way a local would — slowly, and with one person in mind.';

export function HomePage() {
  const root = useRef<HTMLElement>(null);
  const indexRows = useRef<HTMLDivElement>(null);
  const floater = useRef<HTMLDivElement>(null);
  const [plate, setPlate] = useState(0);
  const [preview, setPreview] = useState(-1);
  const [voice, setVoice] = useState(0);
  const [clock, setClock] = useState('—— ——');

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date())
      );

    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);

  useGSAP(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      gsap.set('[data-reveal], .rc-line i, .rc-word', { opacity: 1, y: 0, yPercent: 0, filter: 'none' });
      return;
    }

    const lenis = new Lenis({ smoothWheel: true, syncTouch: false, wheelMultiplier: 0.85 });
    const raf = (time: number) => lenis.raf(time * 1000);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      /* Hero — masked line reveal, then the instruments settle in */
      gsap
        .timeline({ defaults: { ease: 'power3.out' } })
        .from('.rc-hero-plate.is-live img', { scale: 1.14, duration: 1.8, ease: 'power2.out' }, 0)
        .from('.rc-hero-body .rc-eyebrow', { opacity: 0, y: 18, duration: 0.7 }, 0.15)
        .from('.rc-line i', { yPercent: 118, duration: 1.15, stagger: 0.09 }, 0.2)
        .from('.rc-hero-sub, .rc-hero-body .rc-hero-actions', { opacity: 0, y: 26, duration: 0.8, stagger: 0.08 }, 0.75)
        .from('.rc-chip', { opacity: 0, y: -22, duration: 0.8, stagger: 0.09 }, 0.6)
        .from('.rc-rail-cell', { opacity: 0, y: 26, duration: 0.8, stagger: 0.07 }, 0.85);

      /* Hero parallax — the frame lets go of the photograph as you leave */
      gsap
        .timeline({ scrollTrigger: { trigger: '.rc-hero', start: 'top top', end: 'bottom top', scrub: 1 } })
        .to('.rc-hero-plate img', { yPercent: 14, scale: 1.08, ease: 'none' }, 0)
        .to('.rc-hero-body, .rc-rail', { opacity: 0, y: -48, ease: 'none' }, 0);

      /* Generic scroll reveals */
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 54,
          duration: 1,
          ease: 'power3.out',
          delay: Number(el.dataset.reveal) || 0,
          scrollTrigger: { trigger: el, start: 'top 86%' }
        });
      });

      /* Manifesto — words warm up one by one */
      gsap.from('.rc-word', {
        opacity: 0.14,
        duration: 0.5,
        ease: 'none',
        stagger: 0.55,
        scrollTrigger: { trigger: '.rc-manifesto-line', start: 'top 78%', end: 'bottom 58%', scrub: 1 }
      });

      /* Destination index — cursor-tethered plate, desktop only */
      const desktop = gsap.matchMedia();

      desktop.add('(min-width: 1025px) and (pointer: fine)', () => {
        const container = indexRows.current;
        const card = floater.current;
        if (!container || !card) return;

        const moveX = gsap.quickTo(card, 'x', { duration: 0.75, ease: 'power3' });
        const moveY = gsap.quickTo(card, 'y', { duration: 0.75, ease: 'power3' });
        let placed = false;

        const onMove = (event: PointerEvent) => {
          const bounds = container.getBoundingClientRect();
          const x = event.clientX - bounds.left;
          const y = event.clientY - bounds.top;

          /* Drop it under the cursor the first time so it never flies in from the corner */
          if (!placed) {
            gsap.set(card, { x, y });
            placed = true;
            return;
          }

          moveX(x);
          moveY(y);
        };

        container.addEventListener('pointermove', onMove);
        return () => container.removeEventListener('pointermove', onMove);
      });

      /* Experience stack — outgoing cards recede in depth */
      gsap.utils.toArray<HTMLElement>('.rc-stack-card').forEach((card, index, cards) => {
        if (index === cards.length - 1) return;
        gsap.to(card.querySelector('.rc-stack-inner'), {
          scale: 0.93,
          opacity: 0.55,
          ease: 'none',
          scrollTrigger: { trigger: cards[index + 1], start: 'top 92%', end: 'top 34%', scrub: 1 }
        });
      });

      /* Atlas — the route draws itself, waypoints land after it */
      gsap.fromTo(
        '.rc-route',
        { strokeDashoffset: 1400 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: '.rc-atlas-map', start: 'top 78%', end: 'bottom 62%', scrub: 1 }
        }
      );

      gsap.from('.rc-waypoint', {
        opacity: 0,
        y: 14,
        duration: 0.6,
        stagger: 0.18,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.rc-atlas-map', start: 'top 62%' }
      });

      /* Closing frame — opens up as it arrives */
      gsap.from('.rc-invite-frame', {
        scale: 0.9,
        opacity: 0.4,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.rc-invite', start: 'top 84%' }
      });
    }, root);

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, { scope: root });

  const live = heroPlates[plate];
  const shown = preview < 0 ? 0 : preview;

  return (
    <main ref={root} className="rc-home">
      {/* ——— Hero: the page as a printed plate ——— */}
      <section className="rc-hero">
        <div className="rc-shell">
          <div className="rc-hero-frame">
            {heroPlates.map((item, index) => (
              <div className={`rc-hero-plate${index === plate ? ' is-live' : ''}`} key={item.image}>
                <Image
                  src={item.image}
                  alt={`${item.place}, ${item.region}`}
                  fill
                  sizes="100vw"
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                />
              </div>
            ))}
            <div className="rc-hero-wash" />

            <div className="rc-plate-picker" aria-label="Featured places">
              {heroPlates.map((item, index) => (
                <button
                  type="button"
                  key={item.place}
                  aria-pressed={index === plate}
                  className={`rc-chip${index === plate ? ' is-live' : ''}`}
                  style={{ '--r': item.rotate } as React.CSSProperties}
                  onMouseEnter={() => setPlate(index)}
                  onFocus={() => setPlate(index)}
                  onClick={() => setPlate(index)}
                >
                  <Image src={item.image} alt="" fill sizes="140px" />
                  <span>{item.place}</span>
                </button>
              ))}
              <p className="rc-plate-meta" aria-live="polite">
                {live.region}
                <em>{live.meta}</em>
              </p>
            </div>

            <div className="rc-hero-body">
              <span className="rc-eyebrow">Sri Lanka · Private journeys since 2016</span>
              <h1>
                <span className="rc-line"><i>An island that</i></span>
                <span className="rc-line"><i><em>remembers</em> you.</i></span>
              </h1>
              <p className="rc-hero-sub">
                Twelve climates on one small island. We draw unhurried routes through tea country,
                leopard territory and the old ports of the south — led by the people who live there.
              </p>
              <div className="rc-hero-actions">
                <Link href="/contact" className="rc-pill rc-pill-gold group">
                  Plan my journey
                  <span>↗</span>
                </Link>
                <Link href="#journeys" className="rc-pill rc-pill-glass group">
                  See the routes
                  <span>↓</span>
                </Link>
              </div>
            </div>

            <div className="rc-rail">
              <div className="rc-rail-cell">
                <small>Colombo, right now</small>
                <strong>{clock}</strong>
              </div>
              <div className="rc-rail-cell">
                <small>Best window</small>
                <strong>Dec — Apr, south</strong>
              </div>
              <div className="rc-rail-cell">
                <small>In the collection</small>
                <strong>24 routes</strong>
              </div>
              <div className="rc-rail-cell">
                <small>Planned for you by</small>
                <strong>One person</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Ticker ——— */}
      <div className="rc-ticker" aria-hidden="true">
        <div className="rc-ticker-track">
          {[0, 1].map((run) => (
            <span key={run}>
              {ticker.map((word) => (
                <span key={word}>
                  {word}
                  <i />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ——— Manifesto ——— */}
      <section className="rc-manifesto">
        <div>
          <span className="rc-eyebrow rc-eyebrow-ink" data-reveal="0">Our way of working</span>
          <p className="rc-manifesto-line">
            {manifestoLead.split(' ').map((word, index) => (
              <span className="rc-word" key={`${word}-${index}`}>
                {word === 'slowly,' ? <em>{word}</em> : word}{' '}
              </span>
            ))}
          </p>
          <div className="rc-signature" data-reveal="0">
            <div className="rc-signature-face">
              <Image src={art.highland} alt="" fill sizes="72px" />
            </div>
            <div>
              <strong>A planner, not a call centre</strong>
              <span>Colombo · Mon — Sat</span>
            </div>
          </div>
        </div>
        <div className="rc-manifesto-side">
          <p data-reveal="0">
            No two travellers want the same island. A planner in Colombo takes your first note and
            stays with you until the last night — reworking the route around the weather, the
            festivals and whatever you fell for on day three.
          </p>
          <dl className="rc-stats">
            {manifestoStats.map((stat, index) => (
              <div key={stat.label} data-reveal={String(index * 0.08)}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="rc-link" data-reveal="0">
            Meet the people behind it <span>↗</span>
          </Link>
        </div>
      </section>

      {/* ——— Destination index ——— */}
      <section className="rc-index" id="destinations">
        <header className="rc-head" data-reveal="0">
          <div>
            <span className="rc-eyebrow rc-eyebrow-ink">Destinations — five chapters</span>
            <h2>The island, indexed</h2>
          </div>
          <p>
            Ancient stone in the north, cloud forest in the middle, leopards in the east and a long
            warm coast underneath it all.
          </p>
        </header>

        <div
          className="rc-index-rows"
          ref={indexRows}
          onMouseLeave={() => setPreview(-1)}
        >
          {destinations.map((place, index) => (
            <Link
              href={`/destinations/${place.slug}`}
              className="rc-row"
              key={place.slug}
              onMouseEnter={() => setPreview(index)}
              onFocus={() => setPreview(index)}
              data-reveal={String(index * 0.05)}
            >
              <span className="rc-row-num">{String(index + 1).padStart(2, '0')}</span>
              <h3>{place.name}</h3>
              <span className="rc-row-region">{place.region}</span>
              <p>{place.note}</p>
              <i className="rc-row-arrow">↗</i>
              <div className="rc-row-thumb">
                <Image src={place.image} alt={place.name} fill sizes="(max-width: 767px) 90vw, 30vw" />
              </div>
            </Link>
          ))}

          <div className={`rc-floater${preview > -1 ? ' is-live' : ''}`} ref={floater} aria-hidden="true">
            {destinations.map((place, index) => (
              <Image
                key={place.slug}
                src={place.image}
                alt=""
                fill
                sizes="340px"
                className={index === shown ? 'is-live' : ''}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ——— Experiences, stacked ——— */}
      <section className="rc-stack" id="experiences">
        <header className="rc-head rc-head-light" data-reveal="0">
          <div>
            <span className="rc-eyebrow">Experiences</span>
            <h2>Ways to spend a day here</h2>
          </div>
          <p>Every journey is built from days like these — never more than two in a row.</p>
        </header>

        <div className="rc-stack-list">
          {experienceDetail.map((item, index) => (
            <article
              className="rc-stack-card"
              key={item.title}
              style={{ '--i': index } as React.CSSProperties}
            >
              <div className="rc-stack-inner">
                <div className="rc-stack-media">
                  <Image src={item.image} alt={item.title} fill sizes="(max-width: 767px) 92vw, 46vw" />
                  <span>{item.hours}</span>
                </div>
                <div className="rc-stack-copy">
                  <span className="rc-stack-num">{String(index + 1).padStart(2, '0')} / 04</span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <Link href="/contact" className="rc-link rc-link-light">
                    Build a day like this <span>↗</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ——— Atlas ——— */}
      <section className="rc-atlas" id="journeys">
        <div className="rc-atlas-map" data-reveal="0">
          <span className="rc-eyebrow rc-eyebrow-ink">Signature journeys</span>
          <h2>Routes drawn by hand</h2>
          <div className="rc-map-holder">
            <svg viewBox="0 0 520 760" role="img" aria-label="A private route through Sri Lanka">
              <path className="rc-island" d={island} />
              <path className="rc-route-ghost" d={routeLine} />
              <path className="rc-route" d={routeLine} />
              {waypoints.map((point) => (
                <g className="rc-waypoint" key={point.name}>
                  <circle cx={point.x} cy={point.y} r="8" />
                  <text x={point.x + 20} y={point.y + 1}>{point.name}</text>
                  <text className="rc-waypoint-day" x={point.x + 20} y={point.y + 17}>{point.day}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        <div className="rc-atlas-list">
          {tours.map((tour, index) => (
            <Link href={`/tours/${tour.slug}`} className="rc-journey" key={tour.slug} data-reveal={String(index * 0.06)}>
              <div className="rc-journey-inner">
                <div className="rc-journey-media">
                  <Image src={tour.image} alt={tour.title} fill sizes="(max-width: 767px) 92vw, 32vw" />
                </div>
                <div className="rc-journey-copy">
                  <span>{tour.days} · {tour.route}</span>
                  <h3>{tour.title}</h3>
                  <p>{journeyNotes[tour.slug]}</p>
                  <div className="rc-journey-foot">
                    <strong>{tour.price}</strong>
                    <i>↗</i>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <Link href="/contact" className="rc-link" data-reveal="0">
            Or start from a blank page <span>↗</span>
          </Link>
        </div>
      </section>

      {/* ——— Voices ——— */}
      <section className="rc-voices">
        <div className="rc-voices-inner" data-reveal="0">
          <span className="rc-eyebrow rc-eyebrow-ink">Travellers&rsquo; notes</span>
          <blockquote key={voice}>{voices[voice].quote}</blockquote>
          <div className="rc-voices-foot">
            <div>
              <strong>{voices[voice].name}</strong>
              <span>{voices[voice].trip}</span>
            </div>
            <div className="rc-voices-controls">
              <button
                type="button"
                aria-label="Previous note"
                onClick={() => setVoice((voice - 1 + voices.length) % voices.length)}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next note"
                onClick={() => setVoice((voice + 1) % voices.length)}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ——— Closing frame ——— */}
      <section className="rc-invite">
        <div className="rc-shell">
          <div className="rc-invite-frame">
            <Image src={art.coast} alt="" fill sizes="100vw" />
            <div className="rc-invite-wash" />
            <div className="rc-invite-body">
              <span className="rc-eyebrow">Your story starts here</span>
              <h2>Where memories<br />find home.</h2>
              <p>
                Tell us when you can travel and what you cannot miss. You will hear back from a
                planner in Colombo — not a form.
              </p>
              <div className="rc-hero-actions">
                <Link href="/contact" className="rc-pill rc-pill-gold group">
                  Start planning
                  <span>↗</span>
                </Link>
                <a href="mailto:journeys@reiseceylon.com" className="rc-pill rc-pill-glass group">
                  journeys@reiseceylon.com
                  <span>✉</span>
                </a>
              </div>
            </div>
            <div className="rc-invite-meta">
              <span>Colombo · Sri Lanka</span>
              <span>Replies within one working day</span>
              <span>No deposit until the route is right</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
