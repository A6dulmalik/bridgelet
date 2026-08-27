/**
 * OptimizedImage.tsx
 *
 * Issue #472: Image and static asset optimization.
 *
 * A thin wrapper around next/image that enforces the project's image
 * optimization conventions:
 *  - Above-the-fold images: priority={true}, no lazy loading
 *  - Below-the-fold images: loading="lazy" (default for next/image)
 *  - All images get sizes attribute for responsive layout hints
 *  - Alt text required — TypeScript enforces it
 *
 * Usage:
 *   // Above the fold (hero, first visible image)
 *   <OptimizedImage src="/hero.webp" alt="..." width={800} height={600} priority />
 *
 *   // Below the fold (feature images, screenshots)
 *   <OptimizedImage src="/feature.webp" alt="..." width={400} height={300} />
 */

import Image, { type ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'alt'> {
  /** Alt text is required for accessibility. Use "" for decorative images. */
  alt: string;
  /**
   * Set true for above-the-fold images (hero, first viewport).
   * Disables lazy loading and preloads the image as high priority.
   */
  priority?: boolean;
  /**
   * Responsive sizes hint. Defaults to a sensible full-width value.
   * Override for images that don't span the full viewport width.
   */
  sizes?: string;
}

export function OptimizedImage({
  alt,
  priority = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw',
  ...props
}: OptimizedImageProps) {
  return (
    <Image
      alt={alt}
      priority={priority}
      // next/image defaults to lazy loading — explicitly set for below-fold
      loading={priority ? 'eager' : 'lazy'}
      sizes={sizes}
      {...props}
    />
  );
}
