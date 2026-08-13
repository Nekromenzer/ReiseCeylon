/**
 * robots.txt.
 *
 * A single `User-agent: *` rule already permits everything, so on the face of it
 * the explicit lists below change nothing. They are here because absence and
 * permission look identical in robots.txt, and several of these crawlers are
 * operated by companies that have been asked to leave enough sites that being
 * named and allowed is a materially different signal from not being mentioned.
 *
 * Two families, listed apart because they answer different questions:
 *
 *   Answer engines — the crawlers behind ChatGPT, Claude, Perplexity, Gemini and
 *   Copilot. These are the ones that decide whether reiseceylon.com is quoted
 *   when someone asks an assistant how far Sigiriya is from Colombo. Allowing
 *   them is the whole point of the structured data and the FAQ blocks.
 *
 *   Training crawlers — Google-Extended and Applebot-Extended in particular.
 *   Neither fetches anything: they are consent switches read by the regular
 *   crawler, and they govern whether the content may inform Gemini and Apple
 *   Intelligence rather than whether it may be indexed. Blocking them does not
 *   remove the site from search, and allowing them does not add it.
 *
 * `/studio` is Sanity's own application and `/api/` is machinery — the journey
 * enquiry endpoint, the revalidate webhook and an OpenStreetMap proxy. Neither
 * has a reader, so neither is offered to a crawler.
 */
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

const OFF_LIMITS = ['/studio', '/studio/', '/api/'];

/** The crawlers behind the assistants people actually ask travel questions of. */
const answerEngines = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-CloudVertexBot',
  'DuckAssistBot',
  'Amazonbot',
  'Applebot',
  'Bingbot',
  'Googlebot'
];

/** Consent switches rather than crawlers — see the note above. */
const trainingSignals = ['Google-Extended', 'Applebot-Extended'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: OFF_LIMITS },
      { userAgent: answerEngines, allow: '/', disallow: OFF_LIMITS },
      { userAgent: trainingSignals, allow: '/' }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
