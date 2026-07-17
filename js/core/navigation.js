export function initNavigation() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const toggle = navbar.querySelector('.navbar__toggle');
  const links = navbar.querySelector('.navbar__links');

  // Two deliberate thresholds, not five simultaneous style changes:
  // top (transparent-ish) -> is-scrolled (full glass, ~40px) ->
  // is-condensed (shrink + logo scale, once the hero has clearly passed).
  const CONDENSE_AT = 400;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('is-scrolled', window.scrollY > 40);
    navbar.classList.toggle('is-condensed', window.scrollY > CONDENSE_AT);
  }, { passive: true });

  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  initBackToTop();
}

// Long pages (home, work, services) can run 5-9 viewports tall. A small,
// unobtrusive back-to-top control gives people an easy way out instead of
// a long manual scroll back, without adding anything to the visual rhythm
// while they're actually reading.
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&uarr;';

  btn.addEventListener('click', () => {
    if (window.__lenis) {
      window.__lenis.scrollTo(0, { duration: 1.1 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('is-visible', window.scrollY > window.innerHeight * 1.2);
  }, { passive: true });
}
