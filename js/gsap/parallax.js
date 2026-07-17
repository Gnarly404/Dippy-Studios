import { prefersReducedMotion } from '../core/utilities.js';

export function initParallax() {
  if (prefersReducedMotion() || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('[data-speed]').forEach((el) => {
    const speed = parseFloat(el.dataset.speed) || 0.2;
    gsap.to(el, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  });
}
