import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PortableBody } from '@/components/PortableBody';
import { Reveal } from '@/components/Reveal';
import { cardMeta, formatDate } from '@/lib/journal';
import { urlForImage } from '@/sanity/image';
import { getPost, getPostSlugs, getRelatedPosts } from '@/sanity/queries';

/* Entries published after the build are rendered on first request, then cached. */
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Field Notes' };

  const description = post.seoDescription ?? post.excerpt ?? undefined;
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      images: [urlForImage(post.coverImage, 1200, 630)]
    }
  };
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(slug);

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
          <span>{cardMeta(post.category, post.readingTime)}</span>
          <h1>{post.title}</h1>
          {post.excerpt ? <p>{post.excerpt}</p> : null}
        </div>
      </section>

      <article className="article-shell">
        <aside className="article-meta">
          <div>
            <strong>Published</strong>
            <span>{formatDate(post.publishedAt)}</span>
          </div>
          {post.author ? (
            <div>
              <strong>Written by</strong>
              <span>{post.author.name}</span>
              {post.author.role ? <em>{post.author.role}</em> : null}
            </div>
          ) : null}
          {post.category ? (
            <div>
              <strong>Filed under</strong>
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
                    <span>{cardMeta(entry.category, entry.readingTime)}</span>
                    <h3>{entry.title}</h3>
                  </div>
                  <i>↗</i>
                </Link>
              </Reveal>
            ))}
          </div>
          <Link href="/blog" className="text-link">All field notes <span>↗</span></Link>
        </section>
      ) : null}
    </main>
  );
}
