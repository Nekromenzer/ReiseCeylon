/** Normalise an editor-managed address before placing it in a mailto URL. */
export function emailHref(email: string) {
  return `mailto:${email.trim().toLowerCase()}`;
}

/** Convert an editor-friendly phone number into a safe clickable link. */
export function phoneHref(phone: string) {
  return `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
}

/** WhatsApp requires the international number as digits only. */
export function whatsappHref(phone: string) {
  return `https://api.whatsapp.com/send?phone=${phone.replace(/\D/g, '')}`;
}
