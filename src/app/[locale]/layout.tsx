import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { alternatesFor, SITE_URL } from '@/lib/seo';
import { siteGraph } from '@/lib/schema';
import { getContactDetails } from '@/sanity/site';
import { localeTags, routing } from '@/i18n/routing';

/*
 * latin-ext is carried as well as latin: the dialling-code list names Türkiye and
 * Czechia, and the German, French and Dutch copy reaches for characters the base
 * latin subset does not hold.
 */
const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin', 'latin-ext'],
  weight: ['500', '600', '700'],
  style: ['normal', 'italic']
});

const body = Manrope({
  variable: '--font-interface',
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700']
});

/** All four languages are known at build time, so all four prerender. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(SITE_URL),
    icons: { icon: '/brand/logo-primary.png' },
    title: {
      default: t('siteTitle'),
      template: '%s — ReiseCeylon'
    },
    description: t('siteDescription'),
    applicationName: 'ReiseCeylon',
    alternates: {
      ...alternatesFor('/', locale),
      /* The journal as a feed — how an aggregator, a reader and a crawler that
         prefers structured lists over html all find new entries. */
      types: { 'application/rss+xml': `${SITE_URL}/feed.xml` }
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      siteName: 'ReiseCeylon',
      locale: localeTags[locale as keyof typeof localeTags],
      images: ['/images/sigiriya.jpg']
    },
    twitter: {
      card: 'summary_large_image',
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: ['/images/sigiriya.jpg']
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 }
    }
  };
}

export default async function LocaleLayout({
  children,
  params
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  /* Opts this tree into static rendering — without it every page goes dynamic. */
  setRequestLocale(locale);

  /* The agency and the site itself, declared once on every url in every language.
     Both nodes carry a fixed @id, so the 700-odd pages that repeat them resolve
     to one company and one website rather than 700 of each. */
  const [t, contact] = await Promise.all([
    getTranslations({ locale, namespace: 'meta' }),
    getContactDetails(locale)
  ]);

  return (
    <html lang={localeTags[locale]} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
        <JsonLd
          data={siteGraph({
            locale,
            contact,
            name: t('siteTitle'),
            description: t('siteDescription')
          })}
        />
        {/* The whole catalogue for this one language crosses to the browser, which
            is what lets the planner and the homepage translate client-side. */}
        <NextIntlClientProvider>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
        <Analytics />
      </body>
      <GoogleAnalytics gaId="G-2NS65L5S3F" />
    </html>
  );
}
