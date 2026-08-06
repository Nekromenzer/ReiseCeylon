import { NextStudio } from 'next-sanity/studio';
import config from '../../../../../sanity.config';

/** The studio is a client-side app; nothing here needs to be re-rendered per request. */
export const dynamic = 'force-static';

export default function StudioPage() {
  return <NextStudio config={config} />;
}
