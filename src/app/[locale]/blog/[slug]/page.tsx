import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PortableBody } from '@/components/PortableBody';
import { Reveal } from '@/components/Reveal';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { cardMeta, formatDate } from '@/lib/journal';
import { alternatesFor } from '@/lib/seo';
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
  return {
    title: post.title,
    description,
    alternates: alternatesFor(`/blog/${slug}`, locale),
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [urlForImage(post.coverImage, 1200, 630)]
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

  const [t, post] = await Promise.all([getTranslations('blog'), getPost(slug, locale)]);
  if (!post) notFound();

  const related = await getRelatedPosts(slug, locale);
  const readingLabel = post.readingTime ? t('minRead', { minutes: post.readingTime }) : null;

  return (
    <main>
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
