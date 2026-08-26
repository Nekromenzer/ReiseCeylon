import { setRequestLocale } from 'next-intl/server';
import { ClientMessages } from '@/components/ClientMessages';
import { HomePage } from '@/components/HomePage';
import { getContactDetails, getFeaturedDestinations, getTours } from '@/sanity/site';

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [destinations, tours, contact] = await Promise.all([
    getFeaturedDestinations(locale),
    getTours(locale),
    getContactDetails(locale)
  ]);
  return (
    <ClientMessages locale={locale} namespaces={['home', 'content']}>
      <HomePage destinations={destinations} tours={tours} contactEmail={contact.email} />
    </ClientMessages>
  );
}
