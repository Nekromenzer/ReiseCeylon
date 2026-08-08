/**
 * Dialling codes for the mobile number on the enquiry form.
 *
 * A number without its country code is unusable to someone calling from Sri
 * Lanka, and asking a traveller to type "+" and remember their own prefix loses
 * more numbers than it saves. The code is picked from a list instead.
 *
 * The list leads with Sri Lanka and the markets most ReiseCeylon travellers
 * write from, then continues alphabetically. It is deliberately not every
 * country on earth: a select nobody can scroll is worse than a short one, and
 * `Elsewhere` lets anyone type their own prefix.
 */
export type DialCode = { code: string; country: string };

export const LEADING_DIAL_CODES: DialCode[] = [
  { code: '+94', country: 'Sri Lanka' },
  { code: '+49', country: 'Germany' },
  { code: '+44', country: 'United Kingdom' },
  { code: '+91', country: 'India' },
  { code: '+1', country: 'United States / Canada' },
  { code: '+61', country: 'Australia' },
  { code: '+33', country: 'France' },
  { code: '+31', country: 'Netherlands' }
];

export const OTHER_DIAL_CODES: DialCode[] = [
  { code: '+43', country: 'Austria' },
  { code: '+32', country: 'Belgium' },
  { code: '+55', country: 'Brazil' },
  { code: '+86', country: 'China' },
  { code: '+420', country: 'Czechia' },
  { code: '+45', country: 'Denmark' },
  { code: '+20', country: 'Egypt' },
  { code: '+358', country: 'Finland' },
  { code: '+30', country: 'Greece' },
  { code: '+852', country: 'Hong Kong' },
  { code: '+36', country: 'Hungary' },
  { code: '+62', country: 'Indonesia' },
  { code: '+353', country: 'Ireland' },
  { code: '+972', country: 'Israel' },
  { code: '+39', country: 'Italy' },
  { code: '+81', country: 'Japan' },
  { code: '+254', country: 'Kenya' },
  { code: '+60', country: 'Malaysia' },
  { code: '+960', country: 'Maldives' },
  { code: '+52', country: 'Mexico' },
  { code: '+64', country: 'New Zealand' },
  { code: '+47', country: 'Norway' },
  { code: '+92', country: 'Pakistan' },
  { code: '+63', country: 'Philippines' },
  { code: '+48', country: 'Poland' },
  { code: '+351', country: 'Portugal' },
  { code: '+974', country: 'Qatar' },
  { code: '+7', country: 'Russia / Kazakhstan' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+65', country: 'Singapore' },
  { code: '+27', country: 'South Africa' },
  { code: '+82', country: 'South Korea' },
  { code: '+34', country: 'Spain' },
  { code: '+46', country: 'Sweden' },
  { code: '+41', country: 'Switzerland' },
  { code: '+886', country: 'Taiwan' },
  { code: '+66', country: 'Thailand' },
  { code: '+90', country: 'Türkiye' },
  { code: '+971', country: 'United Arab Emirates' },
  { code: '+84', country: 'Vietnam' }
];

/** Chosen when none of the listed countries fit; the traveller types the prefix. */
export const OTHER_DIAL_CODE = 'other';

export const DEFAULT_DIAL_CODE = '+94';
