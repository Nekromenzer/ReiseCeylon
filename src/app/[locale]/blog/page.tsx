import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { cardMeta } from '@/lib/journal';
import { breadcrumbSchema, itemListSchema, pageSchema } from '@/lib/schema';
import { alternatesFor, urlFor, SITE_URL } from '@/lib/seo';
import { urlForImage } from '@/sanity/image';
import { getPosts } from '@/sanity/queries';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('blogTitle'),
    description: t('blogDescription'),
    alternates: {
      ...alternatesFor('/blog', locale),
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` }
    },
    openGraph: {
      title: t('blogTitle'),
      description: t('blogDescription'),
      url: urlFor('/blog', locale),
      type: 'website'
    }
  };
}

/** The photographs behind the placeholder cards, paired by position. */
const placeholderImages = [
  '/images/mirissa.jpg',
  '/images/ella.jpg',
  '/images/forest.jpg',
  '/images/sigiriya.jpg',
  '/images/ella.jpg'
];

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, meta, posts] = await Promise.all([
    getTranslations('blog'),
    getTranslations('meta'),
    getPosts(locale)
  ]);

  /* Shown until the first entry is published in the studio, so the journal never
     renders as an empty page. */
  const placeholders = t.raw('placeholders') as Array<{ title: string; category: string }>;

  return (
    <main>
      <JsonLd
        data={[
          pageSchema({
            type: 'CollectionPage',
            name: meta('blogTitle'),
            description: meta('blogDescription'),
            path: '/blog',
            locale
          }),
          /* Only real entries are listed. The placeholder cards below exist so
             an empty journal still renders; declaring them as articles would be
             advertising pages that do not exist. */
          posts.length > 0
            ? itemListSchema({
                name: meta('blogTitle'),
                url: urlFor('/blog', locale),
                items: posts.map((post) => ({
                  name: post.title,
                  url: urlFor(`/blog/${post.slug}`, locale)
                }))
              })
            : null,
          breadcrumbSchema([{ name: meta('blogTitle'), path: '/blog' }], locale)
        ]}
      />
      <section className="content-section journal-posts-first">
        <div className="destination-grid">
          {posts.length > 0
            ? posts.map((post, index) => (
                <Reveal className={`destination-card destination-${(index % 5) + 1}`} key={post._id}>
                  <Link href={`/blog/${post.slug}`}>
                    <Image
                      src={urlForImage(post.coverImage, 1400, 900)}
                      alt={post.coverImage.alt ?? ''}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="card-shade" />
                    <div className="destination-copy">
                      <span>
                        {cardMeta(
                          post.category,
                          post.readingTime ? t('minRead', { minutes: post.readingTime }) : null
                        )}
                      </span>
                      <h3>{post.title}</h3>
                    </div>
                    <i>↗</i>
                  </Link>
                </Reveal>
              ))
            : placeholders.map((entry, index) => (
                <Reveal className={`destination-card destination-${index + 1}`} key={entry.title}>
                  <span className="placeholder-card">
                    <Image
                      src={placeholderImages[index]}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="card-shade" />
                    <div className="destination-copy">
                      <span>{entry.category} · {t('comingSoon')}</span>
                      <h3>{entry.title}</h3>
                    </div>
                  </span>
                </Reveal>
              ))}
        </div>
      </section>
      <section className="detail-intro">
        <div>{t('eyebrow')}</div>
        <Reveal>
          <h1 className="editorial-heading">
            {t('headingLine1')}
            <br />
            {t('headingLine2')}
          </h1>
          <p>{t('intro')}</p>
        </Reveal>
      </section>
      <section className="detail-intro editorial-copy-section">
        <div>{t('guideEyebrow')}</div>
        <Reveal>
          <h2 className="editorial-subheading">{t('guideTitle')}</h2>
          <p>{t('guideCopy1')}</p>
          <p>{t('guideCopy2')}</p>
          <p>{t('guideCopy3')}</p>
          <p>{t('guideCopy4')}</p>
        </Reveal>
      </section>
    </main>
  );
}
