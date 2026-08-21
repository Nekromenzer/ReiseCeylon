import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/ContactForm';
import { JsonLd } from '@/components/JsonLd';
import { phoneHref, whatsappHref } from '@/lib/contact-links';
import { breadcrumbSchema, pageSchema } from '@/lib/schema';
import { alternatesFor, urlFor } from '@/lib/seo';
import { getContactDetails } from '@/sanity/site';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('contactTitle'),
    description: t('contactDescription'),
    alternates: alternatesFor('/contact', locale),
    openGraph: {
      title: t('contactTitle'),
      description: t('contactDescription'),
      url: urlFor('/contact', locale),
      type: 'website'
    }
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, meta, contact] = await Promise.all([
    getTranslations('contact'),
    getTranslations('meta'),
    getContactDetails(locale)
  ]);

  return (
    <main className="contact-page">
      <JsonLd
        data={[
          pageSchema({
            type: 'ContactPage',
            name: meta('contactTitle'),
            description: meta('contactDescription'),
            path: '/contact',
            locale
          }),
          breadcrumbSchema([{ name: meta('contactTitle'), path: '/contact' }], locale)
        ]}
      />
      <div className="contact-copy">
        <p className="eyebrow">{t('eyebrow')}</p>
        <h1 className="contact-heading">
          {t('headingLine1')}
          <br />
          {t('headingLine2')}
        </h1>
        <p>{t('intro', { responseTime: contact.responseTime })}</p>
        <div className="contact-details">
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          {contact.phone ? <a href={phoneHref(contact.phone)}>{contact.phone}</a> : null}
          {contact.whatsapp ? (
            <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer">
              {t('whatsapp')}
            </a>
          ) : null}
          <span>{contact.address ?? contact.location}</span>
        </div>
      </div>
      <ContactForm />
    </main>
  );
}
