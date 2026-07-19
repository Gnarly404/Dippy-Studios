import { prefersReducedMotion } from './utilities.js';

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
    initMobileMenu(toggle, links);
  }

  initActivePill(navbar, links);
  initBackToTop();
}

// ---------------------------------------------------------------------------
// Mobile menu: burger <-> X, left-docked drawer slide-in/out (handled by a
// CSS transform transition on .is-open, not GSAP -- keeps this in sync with
// the page-push effect, which is also pure CSS), plus all the interaction
// details a premium mobile nav needs (scroll lock, outside click, Escape,
// link click, resize, focus return).
// ---------------------------------------------------------------------------
function initMobileMenu(toggle, links) {
  let isOpen = false;
  let lastFocused = null;

  function open() {
    isOpen = true;
    lastFocused = document.activeElement;
    links.classList.add('is-open');
    toggle.classList.add('is-active');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    isOpen = false;
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    links.classList.remove('is-open');

    if (restoreFocus) {
      // Wait for the slide-out transition so focus doesn't jump while the
      // drawer is still visibly animating away.
      window.setTimeout(() => (lastFocused || toggle).focus(), 450);
    }
  }

  toggle.addEventListener('click', () => (isOpen ? close() : open()));

  // Clicking a nav link closes the menu (let the navigation itself proceed).
  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => close({ restoreFocus: false }));
  });

  // Click outside the panel and toggle closes it.
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (links.contains(e.target) || toggle.contains(e.target)) return;
    close({ restoreFocus: false });
  });

  // Escape closes it.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) close();
  });

  // Resizing up to desktop width closes it (avoids a stuck open panel
  // underneath the now-visible desktop nav).
  window.addEventListener('resize', () => {
    if (isOpen && window.innerWidth >= 960) close({ restoreFocus: false });
  });
}

// ---------------------------------------------------------------------------
// Desktop active/hover pill: a small translucent indicator that slides
// between links instead of a static underline, settling on whichever link
// is active when the mouse leaves the nav.
// ---------------------------------------------------------------------------
function initActivePill(navbar, links) {
  if (!links || window.matchMedia('(max-width: 959px)').matches) return;
  if (prefersReducedMotion()) return;

  const gsap = window.gsap;
  const anchors = Array.from(links.querySelectorAll('a'));
  if (!anchors.length) return;

  const pill = document.createElement('span');
  pill.className = 'navbar__pill';
  pill.setAttribute('aria-hidden', 'true');
  links.style.position = 'relative';
  links.appendChild(pill);

  function moveTo(el) {
    const linksRect = links.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const x = rect.left - linksRect.left;
    pill.classList.add('is-visible');
    if (gsap) {
      gsap.to(pill, { x, width: rect.width, duration: 0.35, ease: 'power3.out' });
    } else {
      pill.style.transform = `translateX(${x}px)`;
      pill.style.width = `${rect.width}px`;
    }
  }

  function hide() {
    pill.classList.remove('is-visible');
  }

  const current = links.querySelector('a[aria-current="page"]');
  if (current) moveTo(current);

  anchors.forEach((a) => {
    a.addEventListener('mouseenter', () => moveTo(a));
  });

  links.addEventListener('mouseleave', () => {
    if (current) moveTo(current);
    else hide();
  });
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
