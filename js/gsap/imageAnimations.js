import { prefersReducedMotion } from '../core/utilities.js';

export function initImageReveals() {
  const images = document.querySelectorAll('[data-image-reveal]');
  if (!images.length || prefersReducedMotion() || typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  images.forEach((img) => {
    gsap.fromTo(
      img,
      { clipPath: 'inset(12% 12% 12% 12% round 20px)', scale: 1.15 },
      {
        clipPath: 'inset(0% 0% 0% 0% round 20px)',
        scale: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: img, start: 'top 80%' },
      }
    );
  });
}
