/** Convert an editor-friendly phone number into a safe clickable link. */
export function phoneHref(phone: string) {
  return `tel:${phone.replace(/(?!^\+)[^\d]/g, '')}`;
}

/** WhatsApp requires the international number as digits only. */
export function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}`;
}
