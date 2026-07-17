export function initHeroSection() {
  const cue = document.querySelector('.hero__scroll-cue');
  if (!cue) return;

  cue.addEventListener('click', () => {
    const next = document.querySelector('.hero').nextElementSibling;
    next?.scrollIntoView({ behavior: 'smooth' });
  });
}
