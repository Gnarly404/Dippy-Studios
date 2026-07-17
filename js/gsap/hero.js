import { prefersReducedMotion } from '../core/utilities.js';

// Hero layered parallax. Each layer moves at a different speed so the scene
// reads as having real depth rather than one flat plane. Mobile gets an
// explicitly simpler, lighter version instead of the desktop stack scaled
// down: below 960px only a faint, slow blob drift remains (defined in CSS),
// and no scroll-linked JS parallax runs at all.
export function initHeroParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || prefersReducedMotion()) return;
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 960px)', () => {
    const ribbons = document.querySelector('.ribbon-field'); // background, slowest
    const blob1 = document.querySelector('.gradient-blob--1'); // mid depth
    const blob2 = document.querySelector('.gradient-blob--2'); // mid depth, opposite drift
    const accents = document.querySelector('.hero__accents'); // foreground, fastest

    const scrollCfg = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };

    if (ribbons) gsap.to(ribbons, { yPercent: 12, ease: 'none', scrollTrigger: scrollCfg });
    if (blob1) gsap.to(blob1, { yPercent: 22, ease: 'none', scrollTrigger: scrollCfg });
    if (blob2) gsap.to(blob2, { yPercent: -16, ease: 'none', scrollTrigger: scrollCfg });
    if (accents) gsap.to(accents, { yPercent: 34, ease: 'none', scrollTrigger: scrollCfg });

    // Cleanup returned to matchMedia so it reverts cleanly if the viewport
    // crosses the breakpoint (e.g. orientation change / devtools resize).
    return () => {
      [ribbons, blob1, blob2, accents].forEach((el) => el && gsap.set(el, { clearProps: 'transform' }));
    };
  });

  // No JS parallax context registered below 960px — the CSS-only, reduced
  // gradient wash in gradients.css is the entire mobile treatment.
}
