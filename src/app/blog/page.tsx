import Image from 'next/image';
import { Reveal } from '@/components/Reveal';

export const metadata = { title: 'Field Notes' };

const articles = [
  ['A slow guide to Sri Lanka’s southern edge', 'Coast', '/images/galle.jpg'],
  ['The hands behind a perfect cup of Ceylon tea', 'Food & culture', '/images/tea.jpg'],
  ['Why the quietest safari is often the best one', 'Wildlife', '/images/yala.jpg'],
  ['First light over an ancient kingdom', 'Heritage', '/images/sigiriya.jpg'],
  ['Finding stillness in the hill country', 'Wellbeing', '/images/ella.jpg']
];

export default function BlogPage() {
  return (
    <main>
      <section className="detail-intro" style={{ paddingTop: 190 }}>
        <div>Field notes</div>
        <Reveal><blockquote>Stories for the<br />curious traveller.</blockquote><p>Local perspective, unrushed guides and ideas for seeing Sri Lanka with greater depth.</p></Reveal>
      </section>
      <section className="content-section">
        <div className="destination-grid">
          {articles.map(([title, category, image], index) => (
            <Reveal className={`destination-card destination-${index + 1}`} key={title}>
              <a href="#">
                <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="card-shade" />
                <div className="destination-copy"><span>{category} · 8 min read</span><h3>{title}</h3></div><i>↗</i>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
