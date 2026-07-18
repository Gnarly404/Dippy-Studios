import { prefersReducedMotion } from '../core/utilities.js';

// A deliberate, staggered reveal rather than everything fading in at once.
// Order follows a fixed hierarchy: chrome -> background -> headline ->
// supporting text -> CTAs -> hero media -> decorative accents. Each step
// is guarded so pages missing a given element (most pages have no hero
// media, some have no CTAs in the hero itself) simply skip that step
// instead of erroring.
export function playIntro() {
  if (typeof window.gsap === 'undefined' || prefersReducedMotion()) return;
  const { gsap } = window;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  const addStep = (selector, vars, position) => {
    if (document.querySelector(selector)) tl.from(selector, vars, position);
  };

  // 1. Chrome
  addStep('.navbar', { y: -40, opacity: 0, duration: 0.7 });

  // 2. Background (ribbons + gradient blobs) -- a soft fade/scale so the
  // ambient motion already handled by CSS doesn't start mid-jump.
  addStep('.ribbon-field, .gradient-blob', { opacity: 0, scale: 1.05, duration: 0.9 }, '-=0.35');

  // 3. Headline (eyebrow label, then the split headline lines)
  addStep('.hero .eyebrow', { y: 14, opacity: 0, duration: 0.5 }, '-=0.5');
  addStep('[data-split-text] .line span', { yPercent: 110, duration: 0.9, stagger: 0.06 }, '-=0.3');

  // 4. Supporting text
  addStep('.hero__meta .lede', { y: 20, opacity: 0, duration: 0.6 }, '-=0.4');

  // 5/6. Primary + secondary CTA (only present on some heroes)
  addStep('.hero__ctas .btn--primary', { y: 16, opacity: 0, duration: 0.5 }, '-=0.25');
  addStep('.hero__ctas .btn--ghost, .hero__ctas .btn--accent', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3');

  // 7. Hero media (image/video, where a hero includes one)
  addStep('.hero__media', { opacity: 0, y: 24, scale: 0.98, duration: 0.7 }, '-=0.2');

  // 8. Decorative accents + scroll cue, last -- a finishing flourish rather
  // than competing with the headline for attention.
  addStep('.hero__accent', { opacity: 0, scale: 0.6, duration: 0.5, stagger: 0.06 }, '-=0.2');
  addStep('.hero__scroll-cue', { opacity: 0, y: 10, duration: 0.5 }, '-=0.2');

  return tl;
}
