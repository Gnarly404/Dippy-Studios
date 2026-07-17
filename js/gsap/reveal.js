import { prefersReducedMotion } from '../core/utilities.js';

export function initReveals() {
  const els = document.querySelectorAll('.reveal, [data-fade-up]');
  if (!els.length) return;

  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') {
    // Fallback: IntersectionObserver toggles a class handled purely by CSS
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('is-visible');
      }),
      { threshold: 0.2 }
    );
    els.forEach((el) => io.observe(el));
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);

  els.forEach((el, i) => {
    if (prefersReducedMotion()) {
      el.classList.add('is-visible');
      return;
    }
    gsap.fromTo(
      el,
      { opacity: 0, y: 28 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: (i % 4) * 0.05,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
        },
      }
    );
  });
}
