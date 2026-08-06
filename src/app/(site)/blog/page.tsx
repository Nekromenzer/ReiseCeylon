import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { cardMeta } from '@/lib/journal';
import { urlForImage } from '@/sanity/image';
import { getPosts } from '@/sanity/queries';

export const metadata = { title: 'Field Notes' };

/**
 * Shown until the first entry is published in the studio, so the journal never
 * renders as an empty page.
 */
const placeholders = [
  ['A slow guide to Sri Lanka’s southern edge', 'Coast', '/images/mirissa.jpg'],
  ['The hands behind a perfect cup of Ceylon tea', 'Food & culture', '/images/ella.jpg'],
  ['Why the quietest safari is often the best one', 'Wildlife', '/images/forest.jpg'],
  ['First light over an ancient kingdom', 'Heritage', '/images/sigiriya.jpg'],
  ['Finding stillness in the hill country', 'Wellbeing', '/images/ella.jpg']
];

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main>
      <section className="detail-intro" style={{ paddingTop: 190 }}>
        <div>Field notes</div>
        <Reveal>
          <blockquote>Stories for the<br />curious traveller.</blockquote>
          <p>Local perspective, unrushed guides and ideas for seeing Sri Lanka with greater depth.</p>
        </Reveal>
      </section>
      <section className="content-section">
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
                      <span>{cardMeta(post.category, post.readingTime)}</span>
                      <h3>{post.title}</h3>
                    </div>
                    <i>↗</i>
                  </Link>
                </Reveal>
              ))
            : placeholders.map(([title, category, image], index) => (
                <Reveal className={`destination-card destination-${index + 1}`} key={title}>
                  <span className="placeholder-card">
                    <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" />
                    <div className="card-shade" />
                    <div className="destination-copy">
                      <span>{category} · Coming soon</span>
                      <h3>{title}</h3>
                    </div>
                  </span>
                </Reveal>
              ))}
        </div>
      </section>
    </main>
  );
}
