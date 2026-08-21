import Image from 'next/image';
import { PortableText, type PortableTextComponents } from '@portabletext/react';
import { Link } from '@/i18n/navigation';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImage } from '@/sanity/queries';
import { urlForImage } from '@/sanity/image';

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="article-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="article-h3">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="article-quote">{children}</blockquote>
  },
  marks: {
    link: ({ children, value }) => {
      const href: string = value?.href ?? '#';
      const absolute = /^https?:\/\//.test(href);
      const external = absolute && !/^https:\/\/(www\.)?reiseceylon\.com(\/|$)/.test(href);
      return absolute ? (
        <a
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="article-link"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="article-link">{children}</Link>
      );
    }
  },
  types: {
    inlineImage: ({ value }: { value: SanityImage }) => (
      <figure className="article-figure">
        <Image
          src={urlForImage(value, 1600)}
          alt={value.alt ?? ''}
          width={1600}
          height={1000}
          sizes="(max-width: 900px) 100vw, 900px"
        />
        {value.caption ? <figcaption>{value.caption}</figcaption> : null}
      </figure>
    )
  }
};

export function PortableBody({ value }: { value: PortableTextBlock[] }) {
  return (
    <div className="article-body">
      <PortableText value={value} components={components} />
    </div>
  );
}
