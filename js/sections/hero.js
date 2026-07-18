export function initHeroSection() {
  const cue = document.querySelector('.hero__scroll-cue');
  if (!cue) return;

  cue.addEventListener('click', () => {
    const next = document.querySelector('.hero').nextElementSibling;
    next?.scrollIntoView({ behavior: 'smooth' });
  });

  // Elegant scroll indicator: fades out once the person has actually
  // started scrolling, and fades back in only if they return to the very
  // top -- rather than sitting there permanently, competing with content
  // further down the page.
  const HIDE_AT = 80;
  window.addEventListener('scroll', () => {
    cue.classList.toggle('is-hidden', window.scrollY > HIDE_AT);
  }, { passive: true });
}
