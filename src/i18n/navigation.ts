/**
 * Locale-aware replacements for next/link and the navigation hooks.
 *
 * Components import `Link` from here rather than from `next/link`, and a href of
 * `/destinations` becomes `/de/destinations` for a German reader without the
 * component knowing which language it is rendering in. English keeps the bare
 * path, since `localePrefix` is 'as-needed'.
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
