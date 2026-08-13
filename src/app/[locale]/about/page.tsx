import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { JsonLd } from '@/components/JsonLd';
import { Reveal } from '@/components/Reveal';
import { breadcrumbSchema, pageSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('aboutTitle'),
    description: t('aboutDescription'),
    alternates: alternatesFor('/about', locale),
    openGraph: {
      title: t('aboutTitle'),
      description: t('aboutDescription'),
      url: urlFor('/about', locale),
      type: 'website'
    }
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, meta] = await Promise.all([getTranslations('about'), getTranslations('meta')]);

  return (
    <main>
      <JsonLd
        data={[
          pageSchema({
            type: 'AboutPage',
            name: meta('aboutTitle'),
            description: meta('aboutDescription'),
            path: '/about',
            locale
          }),
          breadcrumbSchema([{ name: meta('aboutTitle'), path: '/about' }], locale)
        ]}
      />
      <section className="page-hero">
        <Image src="/images/forest.jpg" alt={t('heroAlt')} fill priority sizes="100vw" />
        <div className="page-hero-content">
          <span>{t('eyebrow')}</span>
          <h1>
            {t('headingLine1')}
            <br />
            {t('headingLine2')}
          </h1>
          <p>{t('intro')}</p>
        </div>
      </section>
      <section className="detail-intro">
        <div>{t('whyWeExist')}</div>
        <Reveal>
          <blockquote>{t('quote')}</blockquote>
          <p>{t('copy')}</p>
        </Reveal>
      </section>
      <section className="content-section">
        <div className="highlight-grid">
          <Reveal className="highlight-card">
            <span>01</span>
            <h3>{t('card1Title')}</h3>
            <p>{t('card1Copy')}</p>
          </Reveal>
          <Reveal className="highlight-card">
            <span>02</span>
            <h3>{t('card2Title')}</h3>
            <p>{t('card2Copy')}</p>
          </Reveal>
          <Reveal className="highlight-card">
            <span>03</span>
            <h3>{t('card3Title')}</h3>
            <p>{t('card3Copy')}</p>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
