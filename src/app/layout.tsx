import type { Metadata } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const display = Cormorant_Garamond({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['500', '600', '700']
});

const body = Manrope({
  variable: '--font-interface',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
});

export const metadata: Metadata = {
  metadataBase: new URL('https://reiseceylon.com'),
  title: {
    default: 'ReiseCeylon — Where Memories Find Home',
    template: '%s — ReiseCeylon'
  },
  description: 'Private Sri Lanka journeys shaped by local knowledge, thoughtful stays and the rhythms of the island.',
  openGraph: {
    title: 'ReiseCeylon — Discover the soul of Sri Lanka',
    description: 'Slow, personal journeys across Sri Lanka.',
    type: 'website',
    images: ['/images/sigiriya.jpg']
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
