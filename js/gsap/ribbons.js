import { prefersReducedMotion } from '../core/utilities.js';

export function initRibbons() {
  const track = document.querySelector('.ribbon-reel__track');
  if (track) {
    const items = track.innerHTML;
    track.innerHTML = items + items; // duplicate for seamless loop
  }

  if (prefersReducedMotion()) {
    document.querySelectorAll('.ribbon-dash').forEach((el) => el.style.animation = 'none');
  }
}
