import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactForm } from '@/components/ContactForm';
import { alternatesFor } from '@/lib/seo';
import { getContactDetails } from '@/sanity/site';

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('contactTitle'), alternates: alternatesFor('/contact', locale) };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, contact] = await Promise.all([getTranslations('contact'), getContactDetails(locale)]);

  return (
    <main className="contact-page">
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
          {contact.phone ? <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a> : null}
          {contact.whatsapp ? (
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
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
