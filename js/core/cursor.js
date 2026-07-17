import { qs, qsa, prefersReducedMotion } from './utilities.js';

// Custom cursor is a pointer-device enhancement only. Touch devices never
// see this markup activate; they rely on native tap states defined in
// buttons.css / cards.css. This module also never modifies :focus-visible,
// so keyboard navigation is unaffected regardless of pointer type.
const POINTER_QUERY = '(hover: hover) and (pointer: fine)';

export function initCursor() {
  if (!window.matchMedia(POINTER_QUERY).matches) return;
  // The dot/ring follow the mouse every frame via a requestAnimationFrame
  // loop — that's continuous motion the global CSS transition-duration
  // override can't touch, so it needs its own explicit check.
  if (prefersReducedMotion()) return;

  document.documentElement.classList.add('has-custom-cursor');

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');

  document.body.append(dot, ring);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
  });

  // Ring trails slightly behind the dot for a considered, weighted feel
  // rather than a raw 1:1 follow.
  function loop() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.addEventListener('mouseleave', () => {
    dot.setAttribute('data-hidden', 'true');
    ring.setAttribute('data-hidden', 'true');
  });
  document.addEventListener('mouseenter', () => {
    dot.removeAttribute('data-hidden');
    ring.removeAttribute('data-hidden');
  });

  const stateTargets = [
    { selector: 'a, button, [role="button"]', state: 'link' },
    { selector: '[data-cursor-media]', state: 'media' },
    { selector: '.navbar__logo', state: 'logo' },
  ];

  stateTargets.forEach(({ selector, state }) => {
    qsa(selector).forEach((el) => {
      el.addEventListener('mouseenter', () => ring.setAttribute('data-state', state));
      el.addEventListener('mouseleave', () => ring.removeAttribute('data-state'));
    });
  });

  // Re-bind whenever data-driven sections (portfolio, creators, etc.) render
  // new hover targets after fetch() completes.
  document.addEventListener('dippy:content-rendered', () => {
    stateTargets.forEach(({ selector, state }) => {
      qsa(selector).forEach((el) => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = 'true';
        el.addEventListener('mouseenter', () => ring.setAttribute('data-state', state));
        el.addEventListener('mouseleave', () => ring.removeAttribute('data-state'));
      });
    });
  });
}
