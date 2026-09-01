'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fades a block up into view the first time it is scrolled to.
 *
 * This used to be a `motion.div`, which put the whole of framer-motion — 47 KB
 * over the wire, essentially none of it reached — on every route that shows a
 * card, and on the home page too by way of the navigation's prefetch. One
 * observer and two classes do the same job; the timings below are the ones the
 * motion component was configured with, kept exactly.
 */
export function Reveal({
  children,
  className = '',
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || shown) return;

    /* No observer, no reveal to withhold — show the block and leave it alone. */
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShown(true);
        observer.disconnect();
      },
      /* The -80px inset is what `viewport={{ margin: '-80px' }}` asked for: the
         block has to be a little way inside the fold before it wakes up. */
      { rootMargin: '-80px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [shown]);

  return (
    <div
      ref={ref}
      className={`rc-reveal${shown ? ' is-shown' : ''}${className ? ` ${className}` : ''}`}
      style={delay ? { transitionDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
