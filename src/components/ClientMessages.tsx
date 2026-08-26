import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

type Props = {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
};

/**
 * Sends a client island only the translation namespaces it reads.
 *
 * Passing the provider no `messages` prop makes next-intl serialize the complete
 * locale catalogue into every page. Most routes need only navigation labels and
 * one feature namespace, so selecting them here keeps the HTML payload aligned
 * with the visible page instead of repeating tens of kilobytes of unrelated copy.
 */
export async function ClientMessages({ children, locale, namespaces }: Props) {
  const messages = await getMessages({ locale });
  const selected = Object.fromEntries(
    namespaces.flatMap((namespace) =>
      messages[namespace] === undefined ? [] : [[namespace, messages[namespace]]]
    )
  );

  return <NextIntlClientProvider messages={selected}>{children}</NextIntlClientProvider>;
}
