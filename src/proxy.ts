/**
 * Locale routing.
 *
 * Every site request passes through here so an unprefixed path can be rewritten
 * onto the `en` segment and a prefixed one onto its own. The matcher deliberately
 * keeps the studio, the API routes, the Next internals and every static asset out
 * of it — /studio is Sanity's own application and must never gain a language
 * prefix, and an image does not have a language.
 *
 * Next 16 renamed this file convention from `middleware` to `proxy`; the export
 * shape is unchanged.
 */
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: [
    /*
     * Everything except:
     *   api, studio, _next, _vercel   — not localised
     *   anything with a dot in it     — files: images, json, ico, xml, txt
     */
    '/((?!api|studio|_next|_vercel|.*\\..*).*)'
  ]
};
