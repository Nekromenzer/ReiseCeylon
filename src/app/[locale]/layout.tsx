import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { notFound } from 'next/navigation';
import { GoogleAnalytics } from '@next/third-parties/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import '../globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { alternatesFor } from '@/lib/seo';
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
    metadataBase: new URL('https://reiseceylon.com'),
    icons: { icon: '/brand/logo-primary.png' },
    title: {
      default: t('siteTitle'),
      template: '%s — ReiseCeylon'
    },
    description: t('siteDescription'),
    alternates: alternatesFor('/', locale),
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      type: 'website',
      locale: localeTags[locale as keyof typeof localeTags],
      images: ['/images/sigiriya.jpg']
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

  return (
    <html lang={localeTags[locale]} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
        {/* The whole catalogue for this one language crosses to the browser, which
            is what lets the planner and the homepage translate client-side. */}
        <NextIntlClientProvider>
          <Navbar />
          {children}
          <Footer />
        </NextIntlClientProvider>
      </body>
      <GoogleAnalytics gaId="G-2NS65L5S3F" />
    </html>
  );
}
