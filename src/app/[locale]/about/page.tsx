import type { Metadata } from 'next';
import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Reveal } from '@/components/Reveal';
import { alternatesFor } from '@/lib/seo';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('aboutTitle'), alternates: alternatesFor('/about', locale) };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('about');

  return (
    <main>
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
