import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { PortableBody } from '@/components/PortableBody';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cardMeta, formatDate } from '@/lib/journal';
import { articleSchema, breadcrumbSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';
import { urlForImage } from '@/sanity/image';
import { getPost, getPostSlugs, getRelatedPosts } from '@/sanity/queries';

/* Entries published after the build are rendered on first request, then cached. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return routing.locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const [t, post] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getPost(slug, locale)
  ]);
  if (!post) return { title: t('blogTitle') };

  const description = post.seoDescription ?? post.excerpt ?? undefined;
  const image = urlForImage(post.coverImage, 1200, 630);
  const title = t('blogArticleTitle', { title: post.title });
  return {
    title: { absolute: title },
    description,
    authors: post.author ? [{ name: post.author.name }] : undefined,
    alternates: alternatesFor(`/blog/${slug}`, locale),
    openGraph: {
      title,
      description,
      url: urlFor(`/blog/${slug}`, locale),
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: post.author ? [post.author.name] : undefined,
      section: post.category ?? undefined,
      images: [image]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image]
    }
  };
}

export default async function JournalEntryPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [t, meta, post] = await Promise.all([
    getTranslations('blog'),
    getTranslations('meta'),
    getPost(slug, locale)
  ]);
  if (!post) notFound();

  const related = await getRelatedPosts(slug, locale);
  const readingLabel = post.readingTime ? t('minRead', { minutes: post.readingTime }) : null;

  return (
    <main>
      <JsonLd
        data={[
          articleSchema(post, locale, {
            image: urlForImage(post.coverImage, 1200, 630),
            body: post.body
          }),
          breadcrumbSchema(
            [
              { name: meta('blogTitle'), path: '/blog' },
              { name: post.title, path: `/blog/${slug}` }
            ],
            locale
          )
        ]}
      />
      <section className="page-hero">
        <Image
          src={urlForImage(post.coverImage, 2400, 1400)}
          alt={post.coverImage.alt ?? post.title}
          fill
          priority
          sizes="100vw"
        />
        <div className="page-hero-content">
          <span>{cardMeta(post.category, readingLabel)}</span>
          <h1>{post.title}</h1>
          {post.excerpt ? <p>{post.excerpt}</p> : null}
        </div>
      </section>

      <article className="article-shell">
        <aside className="article-meta">
          <div>
            <strong>{t('published')}</strong>
            <span>{formatDate(post.publishedAt, locale)}</span>
          </div>
          {post.author ? (
            <div>
              <strong>{t('writtenBy')}</strong>
              <span>{post.author.name}</span>
              {post.author.role ? <em>{post.author.role}</em> : null}
            </div>
          ) : null}
          {post.category ? (
            <div>
              <strong>{t('filedUnder')}</strong>
              <span>{post.category}</span>
            </div>
          ) : null}
        </aside>
        <Reveal>
          <PortableBody value={post.body} />
        </Reveal>
      </article>

      {related.length > 0 ? (
        <section className="content-section">
          <div className="destination-grid">
            {related.map((entry, index) => (
              <Reveal className={`destination-card destination-${index + 1}`} key={entry._id}>
                <Link href={`/blog/${entry.slug}`}>
                  <Image
                    src={urlForImage(entry.coverImage, 1400, 900)}
                    alt={entry.coverImage.alt ?? ''}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="card-shade" />
                  <div className="destination-copy">
                    <span>
                      {cardMeta(
                        entry.category,
                        entry.readingTime ? t('minRead', { minutes: entry.readingTime }) : null
                      )}
                    </span>
                    <h3>{entry.title}</h3>
                  </div>
                  <i>↗</i>
                </Link>
              </Reveal>
            ))}
          </div>
          <Link href="/blog" className="text-link">
            {t('allNotes')} <span>↗</span>
          </Link>
        </section>
      ) : null}
    </main>
  );
}
