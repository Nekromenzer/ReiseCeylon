import { HomePage } from '@/components/HomePage';
import { getDestinations, getTours } from '@/sanity/site';

export default async function Home() {
  const [destinations, tours] = await Promise.all([getDestinations(), getTours()]);
  return <HomePage destinations={destinations} tours={tours} />;
}
