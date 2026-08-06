import { createImageUrlBuilder, type ImageUrlBuilder } from '@sanity/image-url';
import type { Image } from 'sanity';
import { assertSanityConfigured, dataset, projectId } from './env';

let builder: ImageUrlBuilder | null = null;

/* Built on first use so an unconfigured project fails at request time, not at build time. */
function getBuilder() {
  if (!builder) {
    assertSanityConfigured();
    builder = createImageUrlBuilder({ projectId, dataset });
  }
  return builder;
}

/** Build a CDN url for a Sanity image, honouring the hotspot set in the studio. */
export function urlForImage(source: Image, width: number, height?: number) {
  const image = getBuilder().image(source).auto('format').fit('crop').width(width);
  return (height ? image.height(height) : image).url();
}
