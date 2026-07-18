import { prefersReducedMotion } from '../core/utilities.js';

export function playIntro() {
  if (typeof window.gsap === 'undefined' || prefersReducedMotion()) return;
  const { gsap } = window;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  if (document.querySelector('.navbar')) {
    tl.from('.navbar', { y: -40, opacity: 0, duration: 0.7 });
  }
  if (document.querySelector('[data-split-text] .line span')) {
    tl.from('[data-split-text] .line span', {
      yPercent: 110,
      duration: 0.9,
      stagger: 0.06,
    }, '-=0.3');
  }
  if (document.querySelector('.hero__meta > *')) {
    tl.from('.hero__meta > *', { y: 20, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.4');
  }

  return tl;
}
