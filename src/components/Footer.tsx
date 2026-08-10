import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getContactDetails } from '@/sanity/site';

export async function Footer() {
  const locale = await getLocale();
  const [t, contact] = await Promise.all([
    getTranslations('footer'),
    getContactDetails(locale)
  ]);

  return (
    <footer className="footer">
      <div className="footer-lead">
        <p>{t('lead')}</p>
        <h2>
          {t('headingLine1')}
          <br />
          {t('headingLine2')}
        </h2>
        <div className="footer-action-row">
          <Link href="/contact" className="light-cta">
            {t('cta')} <span>↗</span>
          </Link>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
        </div>
      </div>
      <div className="footer-grid">
        <div>
          <div className="footer-brand">Reise<span>Ceylon</span></div>
          <p>{t('tagline')}</p>
        </div>
        <div>
          <strong>{t('explore')}</strong>
          <Link href="/destinations">{t('destinations')}</Link>
          <Link href="/#experiences">{t('experiences')}</Link>
          <Link href="/journeys">{t('planJourney')}</Link>
        </div>
        <div>
          <strong>{t('company')}</strong>
          <Link href="/about">{t('ourStory')}</Link>
          <Link href="/blog">{t('journal')}</Link>
          <Link href="/contact">{t('contact')}</Link>
        </div>
        <div>
          <strong>{t('sayHello')}</strong>
          <a href={`mailto:${contact.email}`}>{contact.email}</a>
          {contact.phone ? <a href={`tel:${contact.phone.replace(/\s+/g, '')}`}>{contact.phone}</a> : null}
          {contact.whatsapp ? (
            <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
              {t('whatsapp')}
            </a>
          ) : null}
          <span>{contact.location}</span>
          {contact.social.map((link) => (
            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </div>
      <div className="footer-bottom">
        <span>{t('copyright', { year: new Date().getFullYear() })}</span>
        <span>{t('madeIn')}</span>
      </div>
    </footer>
  );
}
