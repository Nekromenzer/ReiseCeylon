import { setRequestLocale } from 'next-intl/server';
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
  return <HomePage destinations={destinations} tours={tours} contactEmail={contact.email} />;
}
