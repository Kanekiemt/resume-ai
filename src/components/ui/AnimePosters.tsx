import { useState, useEffect } from 'react';

/**
 * Free anime image APIs that work reliably:
 * - dmoe.cc: Chinese anime random image CDN, ~1MB JPEG
 * - pic.re: Random anime image in WEBP format
 * - mtyqx.cn: Redirects to random high-res anime wallpaper
 */

const ANIME_IMAGE_SOURCES = [
  'https://www.dmoe.cc/random.php',
  'https://pic.re/image',
  'https://api.mtyqx.cn/api/random.php',
];

interface AnimeImageProps {
  src: string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/* Single anime image with loading state */
function AnimeImage({ src, className, style, alt = '' }: AnimeImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setImgSrc(src);
  }, [src]);

  if (error) return null;

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: loaded ? style?.opacity ?? 1 : 0,
        transition: 'opacity 0.8s ease-in-out',
      }}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}

/* Full-screen background with overlay */
function FullBgImage({ src }: { src: string }) {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <AnimeImage
        src={src}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center',
          opacity: 0.35,
          filter: 'blur(2px) brightness(0.7)',
        }}
      />
      {/* Dark gradient overlays for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          linear-gradient(180deg, rgba(13,17,23,0.75) 0%, rgba(13,17,23,0.3) 40%, rgba(13,17,23,0.2) 70%, rgba(13,17,23,0.6) 100%)
        `,
      }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(13,17,23,0.3) 100%)',
      }} />
    </div>
  );
}

/* Corner accent poster */
function CornerPoster({ src, position }: { src: string; position: 'top-right' | 'bottom-left' }) {
  const isTR = position === 'top-right';
  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none hidden lg:block"
      style={{
        [isTR ? 'right' : 'left']: 0,
        [isTR ? 'top' : 'bottom']: 0,
        zIndex: 0,
        width: 'clamp(220px, 22vw, 360px)',
        height: 'clamp(160px, 18vw, 260px)',
      }}
    >
      <AnimeImage
        src={src}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.18,
        }}
      />
      {/* Gradient fade edges */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: isTR
          ? 'radial-gradient(ellipse at top right, transparent 30%, rgba(10,15,26,1) 100%)'
          : 'radial-gradient(ellipse at bottom left, transparent 30%, rgba(10,15,26,1) 100%)',
      }} />
    </div>
  );
}

/* Side banner poster (vertical accent) */
function SideBanner({ src }: { src: string }) {
  return (
    <div
      aria-hidden="true"
      className="fixed pointer-events-none hidden xl:block"
      style={{
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 0,
        width: 'clamp(140px, 12vw, 200px)',
        height: 'clamp(300px, 40vh, 500px)',
      }}
    >
      <AnimeImage
        src={src}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.12,
          borderRadius: '4px',
        }}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg, rgba(10,15,26,1) 0%, transparent 20%, transparent 80%, rgba(10,15,26,1) 100%)',
      }} />
    </div>
  );
}

export default function AnimePosters() {
  const [bgSrc, setBgSrc] = useState(ANIME_IMAGE_SOURCES[0]);
  const [posterSrc, setPosterSrc] = useState(ANIME_IMAGE_SOURCES[2]);
  const [bannerSrc, setBannerSrc] = useState(ANIME_IMAGE_SOURCES[1]);

  // Cycle background on click (via parent)
  const cycleImages = () => {
    const nextIdx = (ANIME_IMAGE_SOURCES.indexOf(bgSrc) + 1) % ANIME_IMAGE_SOURCES.length;
    setBgSrc(ANIME_IMAGE_SOURCES[nextIdx]);
    setPosterSrc(ANIME_IMAGE_SOURCES[(nextIdx + 1) % ANIME_IMAGE_SOURCES.length]);
    setBannerSrc(ANIME_IMAGE_SOURCES[(nextIdx + 2) % ANIME_IMAGE_SOURCES.length]);
  };

  // Expose cycle function via data attribute
  useEffect(() => {
    const handler = () => cycleImages();
    window.addEventListener('anime-cycle', handler);
    return () => window.removeEventListener('anime-cycle', handler);
  }, [bgSrc]);

  return (
    <>
      <FullBgImage src={bgSrc} />
      <CornerPoster src={posterSrc} position="top-right" />
      <SideBanner src={bannerSrc} />
    </>
  );
}
