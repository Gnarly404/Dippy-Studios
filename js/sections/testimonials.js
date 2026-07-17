import { fetchJSON, qs, qsa } from '../core/utilities.js';

const FALLBACK = [
  {
    quote: 'Dippy Studios found us creators who actually understood our product. The campaign felt native, not sponsored.',
    name: 'Amina K.',
    role: 'Marketing Lead, Sokojet',
    avatar: 'assets/images/creators/avatar-1.svg',
  },
  {
    quote: 'From strategy to production, everything was handled end-to-end. Our launch outperformed every projection.',
    name: 'Nelson M.',
    role: 'CEO, Gosupa',
    avatar: 'assets/images/creators/avatar-2.svg',
  },
  {
    quote: 'The reporting alone made this worth it — we finally understood our ROI on influencer spend.',
    name: 'Tasha W.',
    role: 'Brand Manager, Luminara Real Estate',
    avatar: 'assets/images/creators/avatar-3.svg',
  },
];

export async function initTestimonialsSection() {
  const track = qs('[data-testimonials-track]');
  if (!track) return;

  let testimonials = await fetchJSON('data/testimonials.json');
  if (!testimonials.length) testimonials = FALLBACK;

  track.innerHTML = testimonials
    .map(
      (t) => `
    <blockquote class="testimonial">
      <p class="testimonial__quote">&ldquo;${t.quote}&rdquo;</p>
      <div class="testimonial__author">
        <img class="testimonial__avatar" src="${t.avatar}" alt="" loading="lazy">
        <div>
          <div class="testimonial__name">${t.name}</div>
          <div class="testimonial__role">${t.role}</div>
        </div>
      </div>
    </blockquote>`
    )
    .join('');

  const prev = qs('[data-testimonials-prev]');
  const next = qs('[data-testimonials-next]');
  const cardWidth = () => track.querySelector('.testimonial')?.getBoundingClientRect().width || 400;

  prev?.addEventListener('click', () => track.scrollBy({ left: -cardWidth() - 24, behavior: 'smooth' }));
  next?.addEventListener('click', () => track.scrollBy({ left: cardWidth() + 24, behavior: 'smooth' }));
}
