/**
 * The studio gets its own root layout: no navbar, no footer, no site styling.
 * Sanity ships its own design system and expects the full viewport.
 */
export const metadata = {
  title: 'ReiseCeylon Studio',
  robots: { index: false, follow: false }
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' as const };

export default function StudioRootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Security and password extensions inject attributes into html/body before
       React hydrates, which React otherwise reports as a mismatch. */
    <html lang="en" suppressHydrationWarning>
      <body style={{ margin: 0 }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
