import { fetchJSON, qs, qsa } from '../core/utilities.js';
import { getDb, collection, getDocs, query, where, isFirebaseConfigured } from '../core/firebaseClient.js';
import { TESTIMONIALS_COLLECTION } from '../core/config.js';

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

async function fetchFromFirestore() {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(getDb(), TESTIMONIALS_COLLECTION), where('status', '==', 'approved'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data());
  } catch (err) {
    console.error('Could not load testimonials from Firestore:', err);
    return [];
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

export async function initTestimonialsSection() {
  const track = qs('[data-testimonials-track]');
  if (!track) return;

  const [jsonTestimonials, firestoreTestimonials] = await Promise.all([
    fetchJSON('data/testimonials.json'),
    fetchFromFirestore(),
  ]);

  const firestoreNames = new Set(firestoreTestimonials.map((t) => t.name));
  const dedupedJson = (jsonTestimonials || []).filter((t) => !firestoreNames.has(t.name));

  let testimonials = [...dedupedJson, ...firestoreTestimonials];
  if (!testimonials.length) testimonials = FALLBACK;

  track.innerHTML = testimonials
    .map(
      (t) => `
    <blockquote class="testimonial">
      <p class="testimonial__quote">&ldquo;${escapeHtml(t.quote)}&rdquo;</p>
      <div class="testimonial__author">
        <img class="testimonial__avatar" src="${escapeHtml(t.avatar)}" alt="" loading="lazy">
        <div>
          <div class="testimonial__name">${escapeHtml(t.name)}</div>
          <div class="testimonial__role">${escapeHtml(t.role)}</div>
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
