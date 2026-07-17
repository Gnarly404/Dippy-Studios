export function createTimeline(options = {}) {
  if (typeof window.gsap === 'undefined') return null;
  return window.gsap.timeline({
    defaults: { ease: 'power3.out', duration: 0.8 },
    ...options,
  });
}
