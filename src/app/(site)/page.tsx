import { HomePage } from '@/components/HomePage';
import { getFeaturedDestinations, getTours } from '@/sanity/site';

export default async function Home() {
  const [destinations, tours] = await Promise.all([getFeaturedDestinations(), getTours()]);
  return <HomePage destinations={destinations} tours={tours} />;
}
