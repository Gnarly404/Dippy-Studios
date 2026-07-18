import { prefersReducedMotion } from './utilities.js';

// Subtle 3D tilt + light parallax on cursor position, desktop only (a
// touch device has no hover position to track, and the effect would just
// be a stuck tilt after tapping). Movement is intentionally small --
// capped at 2 degrees -- so it reads as premium rather than gimmicky.
const MAX_TILT_DEG = 2;

export function initCardTilt() {
  if (prefersReducedMotion()) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const gsap = window.gsap;
  const cards = document.querySelectorAll('.card, .card--case, .card--creator, .card--service');

  cards.forEach((card) => {
    let rect;

    const onEnter = () => {
      rect = card.getBoundingClientRect();
    };

    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * (MAX_TILT_DEG * 2);
      const rotateX = (0.5 - py) * (MAX_TILT_DEG * 2);

      if (gsap) {
        gsap.to(card, {
          y: -6,
          rotateX,
          rotateY,
          duration: 0.4,
          ease: 'power2.out',
          transformPerspective: 800,
          transformOrigin: 'center',
        });
      } else {
        card.style.transform = `perspective(800px) translateY(-6px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      }
    };

    const onLeave = () => {
      rect = null;
      if (gsap) {
        gsap.to(card, { y: 0, rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
      } else {
        card.style.transform = '';
      }
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });
}
