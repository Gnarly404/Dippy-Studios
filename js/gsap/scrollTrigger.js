export function setupScrollTrigger() {
  if (typeof window.gsap === 'undefined' || typeof window.ScrollTrigger === 'undefined') return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  window.addEventListener('load', () => window.ScrollTrigger.refresh());
}
