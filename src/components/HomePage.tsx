'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import Lenis from 'lenis';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { localeTags } from '@/i18n/routing';
import { emailHref } from '@/lib/contact-links';
import {
  art,
  attractionCategories,
  experienceArt,
  heroPlates,
  touristAttractions,
  type AttractionCategory
} from '@/lib/content';
import type { Destination, Tour } from '@/sanity/site';

/** The shapes the translated lists in `content.*` deserialise to. */
type ExperienceCopy = { hours: string; title: string; copy: string };
type StatCopy = { value: string; label: string };
type VoiceCopy = { quote: string; name: string; trip: string };

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function HomePage({
  destinations,
  tours,
  contactEmail
}: {
  destinations: Destination[];
  tours: Tour[];
  contactEmail: string;
}) {
  const t = useTranslations('home');
  const c = useTranslations('content');
  const locale = useLocale();

  /* The narrative lists — read once per render out of the active catalogue. */
  const ticker = c.raw('ticker') as string[];
  const experienceDetail = c.raw('experiences') as ExperienceCopy[];
  const manifestoStats = c.raw('manifestoStats') as StatCopy[];
  const voices = c.raw('voices') as VoiceCopy[];

  const root = useRef<HTMLElement>(null);
  const [plate, setPlate] = useState(0);
  /*
   * The two dormant plates sit at `opacity: 0` behind the live one until a chip
   * is pointed at, but they are inside the viewport, so the browser treats
   * their lazy images as urgent and pulls both at full hero width — 443 KB of
   * photography nobody has asked to see, on the wire beside the plate that is
   * actually the largest contentful paint. They are held back until the page
   * has finished loading, and brought in early if the reader reaches the hero
   * furniture before that.
   */
  const [platesArmed, setPlatesArmed] = useState(false);
  const [activeDestination, setActiveDestination] = useState(0);
  const [voice, setVoice] = useState(0);
  const [clock, setClock] = useState('—— ——');
  const [attractionCategory, setAttractionCategory] = useState<'All' | AttractionCategory>('All');
  const [activeAttraction, setActiveAttraction] = useState(touristAttractions[0].name);

  useEffect(() => {
    if (document.readyState === 'complete') {
      setPlatesArmed(true);
      return;
    }
    const arm = () => setPlatesArmed(true);
    window.addEventListener('load', arm, { once: true });
    return () => window.removeEventListener('load', arm);
  }, []);

  useEffect(() => {
    const tick = () =>
      setClock(
        new Intl.DateTimeFormat(localeTags[locale as keyof typeof localeTags] ?? 'en-GB', {
          timeZone: 'Asia/Colombo',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date())
      );

    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, [locale]);

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
        /* The plate, not the image inside it: the two dormant plates mount after
           this timeline is built, and a selector resolved at build time would
           leave whichever one the reader swaps to sitting still while the rest
           of the hero drifts. The plate fills the clipped frame exactly, so
           moving it reads identically. */
        .to('.rc-hero-plate', { yPercent: 14, scale: 1.08, ease: 'none' }, 0)
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

      /* Destination chapters — imagery opens up and resolves as the rail arrives */
      gsap.utils.toArray<HTMLElement>('.rc-chapter-image').forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 0.88, opacity: 0.42 },
          {
            scale: 1,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '.rc-chapters',
              start: 'top 84%',
              end: 'top 28%',
              scrub: 1
            }
          }
        );
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

  /**
   * Most attraction regions are descriptive ("East Coast") and translate; some
   * are place names ("Jaffna", "Mannar") and must not. Anything the catalogue has
   * no entry for passes through as written.
   */
  const attractionRegion = (region: string) =>
    c.has(`attractionRegions.${region}`) ? c(`attractionRegions.${region}`) : region;

  /** Mounts the plate's photograph and raises it in the same commit. */
  const showPlate = (index: number) => {
    setPlatesArmed(true);
    setPlate(index);
  };

  const live = heroPlates[plate];
  const manifestoLead = t('manifestoLead');
  const manifestoEmphasis = t('manifestoLeadEmphasis');
  const visibleAttractions = touristAttractions.filter(
    (attraction) => attractionCategory === 'All' || attraction.category === attractionCategory
  );
  return (
    <main ref={root} className="rc-home overflow-x-hidden w-full max-w-full">
      {/* ——— Hero: the page as a printed plate ——— */}
      <section className="rc-hero">
        <div className="rc-shell">
          <div className="rc-hero-frame">
            {heroPlates.map((item, index) => (
              <div className={`rc-hero-plate${index === plate ? ' is-live' : ''}`} key={item.key}>
                {(index === 0 || platesArmed) && (
                  <Image
                    src={item.image}
                    alt={`${item.place}, ${c(`heroPlates.${item.key}.region`)}`}
                    fill
                    sizes="100vw"
                    priority={index === 0}
                    fetchPriority={index === 0 ? 'high' : 'low'}
                  />
                )}
              </div>
            ))}
            <div className="rc-hero-wash" />

            <div
              className="rc-plate-picker"
              aria-label={t('heroAriaPlates')}
              onPointerEnter={() => setPlatesArmed(true)}
            >
              {heroPlates.map((item, index) => (
                <button
                  type="button"
                  key={item.key}
                  aria-pressed={index === plate}
                  className={`rc-chip${index === plate ? ' is-live' : ''}`}
                  style={{ '--r': item.rotate } as React.CSSProperties}
                  onMouseEnter={() => showPlate(index)}
                  onFocus={() => showPlate(index)}
                  onClick={() => showPlate(index)}
                >
                  <Image src={item.image} alt="" fill sizes="140px" />
                  <span>{item.place}</span>
                </button>
              ))}
              <p className="rc-plate-meta" aria-live="polite">
                {c(`heroPlates.${live.key}.region`)}
                <em>{c(`heroPlates.${live.key}.meta`)}</em>
              </p>
            </div>

            <div className="rc-hero-body">
              <span className="rc-eyebrow">{t('heroEyebrow')}</span>
              <h1>
                <span className="rc-line"><i>{t('heroTitleLine1')}</i></span>
                {/* No space between the two: `heroTitleRest` carries its own
                    leading space where the language needs one, and carries none
                    where it is only a full stop. */}
                <span className="rc-line"><i><em>{t('heroTitleEm')}</em>{t('heroTitleRest')}</i></span>
              </h1>
              <p className="rc-hero-sub">{t('heroSub')}</p>
              <div className="rc-hero-actions">
                <Link href="/journeys" className="rc-pill rc-pill-gold group">
                  {t('heroPlanCta')}
                  <span>↗</span>
                </Link>
                <Link href="#journeys" className="rc-pill rc-pill-glass group">
                  {t('heroRoutesCta')}
                  <span>↓</span>
                </Link>
              </div>
            </div>

            <div className="rc-rail">
              <div className="rc-rail-cell">
                <small>{t('railClock')}</small>
                <strong>{clock}</strong>
              </div>
              <div className="rc-rail-cell">
                <small>{t('railWindow')}</small>
                <strong>{t('railWindowValue')}</strong>
              </div>
              <div className="rc-rail-cell">
                <small>{t('railCollection')}</small>
                <strong>{t('railCollectionValue')}</strong>
              </div>
              <div className="rc-rail-cell">
                <small>{t('railPlanner')}</small>
                <strong>{t('railPlannerValue')}</strong>
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
          <span className="rc-eyebrow rc-eyebrow-ink" data-reveal="0">{t('manifestoEyebrow')}</span>
          <p className="rc-manifesto-line">
            {manifestoLead.split(' ').map((word, index) => (
              <span className="rc-word" key={`${word}-${index}`}>
                {word === manifestoEmphasis ? <em>{word}</em> : word}{' '}
              </span>
            ))}
          </p>
          <div className="rc-signature" data-reveal="0">
            <div className="rc-signature-face">
              <Image src={art.highland} alt="" fill sizes="72px" />
            </div>
            <div>
              <strong>{t('signatureTitle')}</strong>
              <span>{t('signatureMeta')}</span>
            </div>
          </div>
        </div>
        <div className="rc-manifesto-side">
          <p data-reveal="0">{t('manifestoSide')}</p>
          <dl className="rc-stats">
            {manifestoStats.map((stat, index) => (
              <div key={stat.label} data-reveal={String(index * 0.08)}>
                <dt>{stat.value}</dt>
                <dd>{stat.label}</dd>
              </div>
            ))}
          </dl>
          <Link href="/about" className="rc-link" data-reveal="0">
            {t('manifestoLink')} <span>↗</span>
          </Link>
        </div>
      </section>

      {/* ——— Destination chapters ——— */}
      <section className="rc-chapters" id="destinations">
        <header className="rc-chapters-head" data-reveal="0">
          <h2>
            {t('chaptersHeadingPre')}{' '}
            <span className="rc-inline-landscape" aria-hidden="true">
              <Image src={art.coast} alt="" fill sizes="160px" />
            </span>
            {' '}{t('chaptersHeadingPost')}
          </h2>
          <div className="rc-chapters-intro">
            <p>{t('chaptersIntro')}</p>
            <span>{t('chaptersHint')}</span>
          </div>
        </header>

        <div className="rc-chapter-rail" data-reveal="0">
          {destinations.map((place, index) => (
            <Link
              href={`/destinations/${place.slug}`}
              className={`rc-chapter${index === activeDestination ? ' is-active' : ''}`}
              key={place.slug}
              onMouseEnter={() => setActiveDestination(index)}
              onFocus={() => setActiveDestination(index)}
              aria-label={t('chapterExploreAria', { name: place.name, region: place.region })}
            >
              <Image
                className="rc-chapter-image"
                src={place.image}
                alt={`${place.name}, ${place.region}`}
                fill
                sizes="(max-width: 767px) 94vw, 48vw"
              />
              <span className="rc-chapter-wash" />
              <span className="rc-chapter-top">
                <span>{place.region}</span>
                <i>{String(index + 1).padStart(2, '0')}</i>
              </span>
              <span className="rc-chapter-copy">
                <strong>{place.name}</strong>
                <span>{place.note}</span>
              </span>
              <span className="rc-chapter-action">
                {t('chapterExplore')} <i>↗</i>
              </span>
              <div className="rc-chapter-closed" aria-hidden="true">
                <strong>{place.name}</strong>
                <span>{place.region}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="rc-chapter-progress" aria-hidden="true">
          <span>0{activeDestination + 1}</span>
          <i><b style={{ width: `${((activeDestination + 1) / destinations.length) * 100}%` }} /></i>
          <span>0{destinations.length}</span>
        </div>

        <div className="rc-chapters-foot" data-reveal="0">
          <Link href="/destinations" className="rc-link rc-link-light">
            {t('chaptersFullAtlas')} <span>↗</span>
          </Link>
        </div>
      </section>

      {/* ——— Experiences, stacked ——— */}
      <section className="rc-stack" id="experiences">
        <header className="rc-head rc-head-light" data-reveal="0">
          <div>
            <span className="rc-eyebrow">{t('experiencesEyebrow')}</span>
            <h2>{t('experiencesHeading')}</h2>
          </div>
          <p>{t('experiencesIntro')}</p>
        </header>

        <div className="rc-stack-list">
          {experienceDetail.map((item, index) => (
            <article
              className="rc-stack-card"
              key={item.title}
              style={{ '--stack-offset': `${Math.min(index, 5) * 12}px` } as React.CSSProperties}
            >
              <div className="rc-stack-inner">
                <div className="rc-stack-media">
                  <Image
                    src={experienceArt[index]}
                    alt={item.title}
                    fill
                    sizes="(max-width: 767px) 92vw, 46vw"
                  />
                  <span>{item.hours}</span>
                </div>
                <div className="rc-stack-copy">
                  <span className="rc-stack-num">
                    {String(index + 1).padStart(2, '0')} / {String(experienceDetail.length).padStart(2, '0')}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  <Link href="/contact" className="rc-link rc-link-light">
                    {t('experiencesCta')} <span>↗</span>
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
          <span className="rc-eyebrow rc-eyebrow-ink">{t('atlasEyebrow')}</span>
          <h2>{t('atlasHeadingLine1')}<br /><em>{t('atlasHeadingEm')}</em></h2>
          <p className="rc-atlas-intro">{t('atlasIntro')}</p>
          <div className="rc-map-holder">
            <Image
              className="rc-map-art"
              src="/images/maps/sri-lanka-tour-map.webp"
              alt={t('atlasMapAlt')}
              fill
              sizes="(max-width: 767px) 92vw, (max-width: 1024px) 48vw, 34vw"
            />
          </div>
        </div>

        <div className="rc-atlas-list">
          <div className="rc-attraction-panel" data-reveal="0">
            <div className="rc-attraction-head">
              <div>
                <span>{t('atlasExploreWhole')}</span>
                <h3>{t('atlasPlacesWorth', { count: touristAttractions.length })}</h3>
              </div>
              <strong>{visibleAttractions.length}</strong>
            </div>
            <div className="rc-attraction-filters" aria-label={t('atlasFilterAria')}>
              {attractionCategories.map((category) => (
                <button
                  type="button"
                  className={attractionCategory === category ? 'is-active' : ''}
                  aria-pressed={attractionCategory === category}
                  key={category}
                  onClick={() => {
                    setAttractionCategory(category);
                    setActiveAttraction(
                      (category === 'All'
                        ? touristAttractions[0]
                        : touristAttractions.find((attraction) => attraction.category === category)
                      )?.name ?? touristAttractions[0].name
                    );
                  }}
                >
                  {c(`attractionCategories.${category}`)}
                </button>
              ))}
            </div>
            <div className="rc-attraction-index" aria-live="polite">
              {visibleAttractions.map((attraction) => (
                <button
                  type="button"
                  className={activeAttraction === attraction.name ? 'is-active' : ''}
                  key={attraction.name}
                  onMouseEnter={() => setActiveAttraction(attraction.name)}
                  onFocus={() => setActiveAttraction(attraction.name)}
                  onClick={() => setActiveAttraction(attraction.name)}
                >
                  <i className={`rc-index-dot rc-pin-${attraction.category.toLowerCase().replace(' ', '-')}`} />
                  <span>
                    <strong>{attraction.name}</strong>
                    <small>{attractionRegion(attraction.region)}</small>
                  </span>
                  <em>{c(`attractionCategories.${attraction.category}`)}</em>
                </button>
              ))}
            </div>
          </div>

          <h3 className="rc-tour-list-title">{t('atlasTourListTitle')}</h3>
          {tours.map((tour, index) => (
            <Link href={`/tours/${tour.slug}`} className="rc-journey" key={tour.slug} data-reveal={String(index * 0.06)}>
              <div className="rc-journey-inner">
                <div className="rc-journey-media">
                  <Image src={tour.image} alt={tour.title} fill sizes="(max-width: 767px) 92vw, 32vw" />
                </div>
                <div className="rc-journey-copy">
                  <span>{tour.days} · {tour.route}</span>
                  <h3>{tour.title}</h3>
                  <p>{tour.note}</p>
                  <div className="rc-journey-foot">
                    <strong>{tour.days}</strong>
                    <i>↗</i>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          <Link href="/journeys" className="rc-link" data-reveal="0">
            {t('atlasPlanLink')} <span>↗</span>
          </Link>
        </div>
      </section>

      {/* ——— Voices ——— */}
      <section className="rc-voices">
        <div className="rc-voices-inner" data-reveal="0">
          <span className="rc-eyebrow rc-eyebrow-ink">{t('voicesEyebrow')}</span>
          <blockquote key={voice}>{voices[voice].quote}</blockquote>
          <div className="rc-voices-foot">
            <div>
              <strong>{voices[voice].name}</strong>
              <span>{voices[voice].trip}</span>
            </div>
            <div className="rc-voices-controls">
              <button
                type="button"
                aria-label={t('voicesPrev')}
                onClick={() => setVoice((voice - 1 + voices.length) % voices.length)}
              >
                ←
              </button>
              <button
                type="button"
                aria-label={t('voicesNext')}
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
              <span className="rc-eyebrow">{t('inviteEyebrow')}</span>
              <h2>{t('inviteHeadingLine1')}<br />{t('inviteHeadingLine2')}</h2>
              <p>{t('inviteCopy')}</p>
              <div className="rc-hero-actions">
                <Link href="/contact" className="rc-pill rc-pill-gold group">
                  {t('inviteCta')}
                  <span>↗</span>
                </Link>
                <a href={emailHref(contactEmail)} className="rc-pill rc-pill-glass group">
                  {contactEmail}
                  <span>✉</span>
                </a>
              </div>
            </div>
            <div className="rc-invite-meta">
              <span>{t('inviteMeta1')}</span>
              <span>{t('inviteMeta2')}</span>
              <span>{t('inviteMeta3')}</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
