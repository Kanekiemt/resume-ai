import { useState } from 'react';

const BG_IMAGE = '/36e753fcdc407779440d726f16d20241.jpg';

/* ── Comet fragments — Your Name style ── */
function CometFragments() {
  const fragments = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${2 + Math.random() * 96}%`,
    top: `${Math.random() * 100}%`,
    size: 1.5 + Math.random() * 5,
    duration: 6 + Math.random() * 14,
    delay: Math.random() * 10,
  }));

  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {fragments.map((f) => (
        <div
          key={f.id}
          className="comet-fragment"
          style={{
            left: f.left,
            top: f.top,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            boxShadow: `0 0 ${f.size * 4}px rgba(180,200,240,0.5), 0 0 ${f.size * 8}px rgba(240,180,120,0.3)`,
          }}
        />
      ))}
    </div>
  );
}

export default function CinematicBackground() {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <div aria-hidden="true" className="fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Layer 0: Base image — softer blur for dreamy feel */}
      <img
        src={BG_IMAGE}
        alt=""
        onLoad={() => setImgLoaded(true)}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center',
          filter: 'blur(2px) brightness(0.75) saturate(1.2)',
          transform: 'scale(1.05)',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 1.5s ease-in-out',
        }}
      />

      {/* Layer 1: Twilight gradient — deep blue to warm orange */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          linear-gradient(175deg,
            rgba(20,25,60,0.5) 0%,
            rgba(40,55,90,0.25) 30%,
            rgba(60,80,120,0.1) 55%,
            rgba(200,150,100,0.15) 80%,
            rgba(240,170,110,0.25) 100%
          )
        `,
        mixBlendMode: 'overlay',
      }} />

      {/* Layer 2: Soft vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 45%, transparent 35%, rgba(20,20,50,0.2) 65%, rgba(15,15,35,0.5) 100%)`,
      }} />

      {/* Layer 3: Sunlight bloom — top-right warm glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 600px 400px at 70% 20%, rgba(255,200,150,0.15) 0%, transparent 55%),
          radial-gradient(ellipse 350px 250px at 25% 75%, rgba(130,180,230,0.08) 0%, transparent 50%)
        `,
      }} />

      {/* Layer 4: Atmospheric haze at horizon */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%',
        background: `linear-gradient(180deg, transparent 0%, rgba(180,160,200,0.06) 50%, rgba(120,100,160,0.15) 100%)`,
      }} />

      {/* Layer 5: Top cool gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
        background: `linear-gradient(180deg, rgba(15,20,50,0.4) 0%, rgba(25,35,70,0.1) 50%, transparent 100%)`,
      }} />

      {/* Comet fragments */}
      <CometFragments />
    </div>
  );
}
