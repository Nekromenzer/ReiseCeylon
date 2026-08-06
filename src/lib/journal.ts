/** Shared formatting for the journal. */

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function cardMeta(category: string | null, readingTime: number | null) {
  return [category, readingTime ? `${readingTime} min read` : null].filter(Boolean).join(' · ');
}
