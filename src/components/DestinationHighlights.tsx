'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import type { Highlight } from '@/sanity/site';

/**
 * The highlights of a destination, as an index rather than a row of cards.
 *
 * A sticky plate on the left holds the photograph and the numeral of whichever
 * entry the reader is on; the entries themselves are hairline-separated rows,
 * not boxes. Pointing at a row moves the plate. Nothing is hidden behind the
 * interaction — every word is on the page whether or not you hover, so keyboard
 * and touch readers lose only the decoration.
 */
export function DestinationHighlights({
  highlights,
  image,
  imageAlt,
  eyebrow = 'Highlights',
  heading = 'What we would not miss.'
}: {
  highlights: Highlight[];
  image: string;
  imageAlt: string;
  eyebrow?: string;
  heading?: string;
}) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  if (highlights.length === 0) return null;

  const index = (position: number) => String(position + 1).padStart(2, '0');
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="hl">
      <div className="hl-inner">
        <aside className="hl-plate" aria-hidden="true">
          {/* The plate is hidden below 1024px, so mobile never pays for the photograph. */}
          <Image src={image} alt={imageAlt} fill sizes="(max-width: 1024px) 1px, 34vw" />
          <span className="hl-plate-wash" />
          <div className="hl-plate-body">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
                transition={{ duration: reduced ? 0 : 0.45, ease }}
              >
                <strong className="hl-plate-index">{index(active)}</strong>
                <p className="hl-plate-title">{highlights[active].title}</p>
              </motion.div>
            </AnimatePresence>
            <div className="hl-plate-rail">
              {highlights.map((highlight, position) => (
                <i key={highlight.title} className={position === active ? 'is-on' : ''} />
              ))}
            </div>
          </div>
        </aside>

        <div className="hl-main">
          <header className="hl-head">
            <p className="eyebrow">{eyebrow}</p>
            <h2>{heading}</h2>
            <span className="hl-count">
              {index(0)} — {index(highlights.length - 1)}
            </span>
          </header>

          <ol className="hl-list" onMouseLeave={() => setActive(0)}>
            {highlights.map((highlight, position) => (
              <motion.li
                key={highlight.title}
                className={`hl-row${position === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(position)}
                initial={reduced ? false : { opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-70px' }}
                transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : position * 0.08, ease }}
              >
                <span className="hl-num">{index(position)}</span>
                <div className="hl-copy">
                  <h3>{highlight.title}</h3>
                  <p>{highlight.copy}</p>
                </div>
                <span className="hl-rule" />
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
