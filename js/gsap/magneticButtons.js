import { prefersReducedMotion } from '../core/utilities.js';

export function initMagneticButtons() {
  if (typeof window.gsap === 'undefined') return;
  if (prefersReducedMotion()) return;
  const { gsap } = window;

  document.querySelectorAll('.magnetic').forEach((btn) => {
    const strength = 0.35;

    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, {
        x: relX * strength,
        y: relY * strength,
        duration: 0.4,
        ease: 'power2.out',
      });
    });

    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });
}
