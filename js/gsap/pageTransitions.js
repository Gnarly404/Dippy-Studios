import { prefersReducedMotion } from '../core/utilities.js';

export function initPageTransitions() {
  if (prefersReducedMotion()) return;

  document.querySelectorAll('a[href$=".html"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const url = link.getAttribute('href');
      const isSameOrigin = link.origin === window.location.origin;
      if (!isSameOrigin || link.target === '_blank') return;

      e.preventDefault();
      document.body.style.transition = 'opacity 0.35s ease';
      document.body.style.opacity = '0';
      setTimeout(() => { window.location.href = url; }, 350);
    });
  });

  window.addEventListener('pageshow', () => {
    document.body.style.opacity = '1';
  });
}
