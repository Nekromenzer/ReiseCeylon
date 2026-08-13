import type { JsonLdNode } from '@/lib/schema';

/**
 * One `<script type="application/ld+json">`, or several.
 *
 * Nulls are dropped rather than serialised, so a caller can pass the result of a
 * builder that decided it had nothing to say without guarding at every call
 * site. `<` is escaped on the way out: a place name or a journal title holding
 * the characters `</script>` would otherwise end the block early and spill the
 * rest of the graph into the document as markup.
 */
export function JsonLd({ data }: { data: JsonLdNode | Array<JsonLdNode | null> | null }) {
  const nodes = (Array.isArray(data) ? data : [data]).filter(
    (node): node is JsonLdNode => node !== null
  );
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
