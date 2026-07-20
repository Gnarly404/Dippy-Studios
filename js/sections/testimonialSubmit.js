import { qs } from '../core/utilities.js';
import {
  getDb,
  collection,
  addDoc,
  serverTimestamp,
  isFirebaseConfigured,
} from '../core/firebaseClient.js';
import { sendTestimonialSubmissionEmail, isEmailConfigured } from '../core/emailClient.js';
import { TESTIMONIALS_COLLECTION } from '../core/config.js';
import { MAX_SOURCE_FILE_MB, withTimeout, resizeImageToDataURL } from '../core/imageUtils.js';

function setStatus(statusEl, message, tone) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone || '';
  statusEl.hidden = !message;
}

export function initTestimonialSubmitSection() {
  const form = qs('[data-testimonial-form]');
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = qs('[data-form-status]', form);
  const photoInput = qs('[data-photo-input]', form);
  const photoPreview = qs('[data-photo-preview]', form);
  const photoDropzone = qs('[data-photo-dropzone]', form);
  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  let resizedPhotoDataURL = '';

  if (!isFirebaseConfigured()) {
    setStatus(
      statusEl,
      'This form isn\u2019t fully connected yet \u2014 the site owner still needs to add the Firebase project details. You can preview the form, but submission is disabled for now.',
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

    // Honeypot: see creatorApply.js for the same technique/reasoning.
    if ((data.get('company_website') || '').toString().trim()) {
      form.reset();
      setStatus(statusEl, 'Thank you \u2014 your testimonial has been submitted for review.', 'success');
      return;
    }

    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const role = (data.get('role') || '').toString().trim();
    const quote = (data.get('quote') || '').toString().trim();

    const errors = [];
    if (!name) errors.push('Your name is required.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('That email doesn\u2019t look valid.');
    if (!role) errors.push('Let us know your role and company.');
    if (!quote) errors.push('Tell us about your experience.');

    if (errors.length) {
      setStatus(statusEl, errors.join(' '), 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting\u2026';
    setStatus(statusEl, 'Sending your testimonial\u2026', 'info');

    try {
      await withTimeout(
        addDoc(collection(getDb(), TESTIMONIALS_COLLECTION), {
          name,
          email,
          role,
          quote,
          avatar: resizedPhotoDataURL || '',
          status: 'pending',
          source: 'submission',
          createdAt: serverTimestamp(),
        }),
        15000,
        'Saving your testimonial'
      );

      if (isEmailConfigured()) {
        try {
          await withTimeout(
            sendTestimonialSubmissionEmail({
              from_name: name,
              from_email: email,
              role,
              quote,
            }),
            15000,
            'Sending notification email'
          );
        } catch (emailErr) {
          console.error('EmailJS notification failed:', emailErr);
        }
      }

      form.reset();
      resizedPhotoDataURL = '';
      if (photoPreview) { photoPreview.src = ''; photoPreview.hidden = true; }
      if (photoDropzone) photoDropzone.classList.remove('has-image');
      setStatus(
        statusEl,
        'Thank you \u2014 your testimonial has been submitted for review. We\u2019ll publish it once approved.',
        'success'
      );
    } catch (err) {
      setStatus(
        statusEl,
        `We couldn\u2019t submit that (${err.message}). Please try again in a moment, or email workwithgnarly@gmail.com directly.`,
        'error'
      );
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });
}
