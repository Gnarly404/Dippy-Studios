import { qs } from '../core/utilities.js';
import {
  getDb,
  collection,
  addDoc,
  serverTimestamp,
  isFirebaseConfigured,
} from '../core/firebaseClient.js';
import { sendCreatorApplicationEmail, isEmailConfigured } from '../core/emailClient.js';
import { CREATORS_COLLECTION } from '../core/config.js';

// Photos are stored as a compressed base64 string directly on the Firestore
// document (Firestore's per-document ceiling is ~1MB, and a 900px JPEG at
// 0.82 quality is comfortably well under that) -- this avoids requiring
// Firebase's paid Blaze plan, which Cloud Storage now needs even for tiny
// projects.
const MAX_SOURCE_FILE_MB = 8;
const MAX_OUTPUT_DIMENSION = 900;
const OUTPUT_QUALITY = 0.82;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

function resizeImageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.onload = () => { img.src = reader.result; };

    img.onerror = () => reject(new Error('Could not process that image file.'));
    img.onload = () => {
      const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      resolve(canvas.toDataURL('image/jpeg', OUTPUT_QUALITY));
    };

    reader.readAsDataURL(file);
  });
}

function setStatus(statusEl, message, tone) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone || '';
  statusEl.hidden = !message;
}

export function initCreatorApplySection() {
  const form = qs('[data-creator-apply-form]');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = qs('[data-form-status]');
  const photoInput = qs('[data-photo-input]', form);
  const photoPreview = qs('[data-photo-preview]', form);
  const photoDropzone = qs('[data-photo-dropzone]', form);
  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  let resizedPhotoDataURL = '';

  if (!isFirebaseConfigured()) {
    setStatus(
      statusEl,
      'This form isn\u2019t fully connected yet \u2014 the site owner still needs to add the Firebase project details (see FIREBASE_SETUP.md). You can preview the form, but submission is disabled for now.',
      'warn'
    );
    if (submitBtn) submitBtn.disabled = true;
  }

  if (photoDropzone && photoInput) {
    photoDropzone.addEventListener('click', () => photoInput.click());
    photoDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      photoDropzone.classList.add('is-dragover');
    });
    photoDropzone.addEventListener('dragleave', () => photoDropzone.classList.remove('is-dragover'));
    photoDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      photoDropzone.classList.remove('is-dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        photoInput.files = e.dataTransfer.files;
        photoInput.dispatchEvent(new Event('change'));
      }
    });
  }

  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files && photoInput.files[0];
      resizedPhotoDataURL = '';
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setStatus(statusEl, 'Please choose an image file (JPG, PNG or WEBP).', 'error');
        photoInput.value = '';
        return;
      }
      if (file.size > MAX_SOURCE_FILE_MB * 1024 * 1024) {
        setStatus(statusEl, `That image is a bit large \u2014 please choose one under ${MAX_SOURCE_FILE_MB}MB.`, 'error');
        photoInput.value = '';
        return;
      }

      try {
        resizedPhotoDataURL = await resizeImageToDataURL(file);
        if (photoPreview) {
          photoPreview.src = resizedPhotoDataURL;
          photoPreview.hidden = false;
        }
        if (photoDropzone) photoDropzone.classList.add('has-image');
        setStatus(statusEl, '', '');
      } catch (err) {
        setStatus(statusEl, err.message, 'error');
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isFirebaseConfigured()) return;

    const data = new FormData(form);
    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const bio = (data.get('bio') || '').toString().trim();
    const socials = {
      instagram: (data.get('instagram') || '').toString().trim(),
      tiktok: (data.get('tiktok') || '').toString().trim(),
      youtube: (data.get('youtube') || '').toString().trim(),
      twitter: (data.get('twitter') || '').toString().trim(),
      facebook: (data.get('facebook') || '').toString().trim(),
    };
    const hasSocial = Object.values(socials).some((v) => v.length > 0);

    const errors = [];
    if (!name) errors.push('Full name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
    if (!bio) errors.push('Tell us a little about your content.');
    if (!hasSocial) errors.push('Add at least one social platform link or handle.');
    if (!resizedPhotoDataURL) errors.push('Please upload a profile photo.');

    if (errors.length) {
      setStatus(statusEl, errors.join(' '), 'error');
      return;
    }

    const phone = (data.get('phone') || '').toString().trim();
    const niche = (data.get('niche') || '').toString().trim();
    const followers = (data.get('followers') || '').toString().trim();

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';
    setStatus(statusEl, 'Sending your application\u2026', 'info');

    try {
      await withTimeout(
        addDoc(collection(getDb(), CREATORS_COLLECTION), {
          name,
          email,
          phone,
          niche,
          followers,
          bio,
          socials,
          photo: resizedPhotoDataURL,
          status: 'pending',
          createdAt: serverTimestamp(),
        }),
        15000,
        'Saving your application'
      );

      if (isEmailConfigured()) {
        try {
          await withTimeout(
            sendCreatorApplicationEmail({
              from_name: name,
              from_email: email,
              phone,
              niche,
              followers,
              bio,
              instagram: socials.instagram,
              tiktok: socials.tiktok,
              youtube: socials.youtube,
              twitter: socials.twitter,
              facebook: socials.facebook,
            }),
            15000,
            'Sending notification email'
          );
        } catch (emailErr) {
          // The application is already saved in Firestore either way -- an
          // email hiccup shouldn't block the applicant from seeing success.
          console.error('EmailJS notification failed:', emailErr);
        }
      }

      form.reset();
      resizedPhotoDataURL = '';
      if (photoPreview) { photoPreview.src = ''; photoPreview.hidden = true; }
      if (photoDropzone) photoDropzone.classList.remove('has-image');
      setStatus(
        statusEl,
        'Application received \u2014 thank you! Our team reviews new creators regularly and will reach out by email if it\u2019s a fit.',
        'success'
      );
    } catch (err) {
      setStatus(
        statusEl,
        `We couldn\u2019t submit your application (${err.message}). Please try again in a moment, or email hello@dippystudios.com directly.`,
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}
