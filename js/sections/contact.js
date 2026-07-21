import { qs } from '../core/utilities.js';
import { sendContactInquiryEmail, isEmailConfigured } from '../core/emailClient.js';

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), ms)),
  ]);
}

function setStatus(statusEl, message, tone) {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.dataset.tone = tone || '';
  statusEl.hidden = !message;
}

export function initContactSection() {
  const form = qs('[data-contact-form]');
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const originalBtnText = button ? button.textContent : '';

  const statusEl = qs('[data-form-status]', form);

  if (!isEmailConfigured()) {
    setStatus(
      statusEl,
      'This form isn\u2019t fully connected yet \u2014 the site owner still needs to add the EmailJS details (see FIREBASE_SETUP.md). You can preview the form, but submission is disabled for now.',
      'warn'
    );
    if (button) button.disabled = true;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!isEmailConfigured()) return;

    const data = new FormData(form);

    // Honeypot: see creatorApply.js for the same technique/reasoning.
    if ((data.get('company_website') || '').toString().trim()) {
      form.reset();
      setStatus(statusEl, 'Message sent \u2014 we\u2019ll be in touch soon.', 'success');
      return;
    }

    const name = (data.get('name') || '').toString().trim();
    const email = (data.get('email') || '').toString().trim();
    const message = (data.get('message') || '').toString().trim();

    const errors = [];
    if (!name) errors.push('Full name is required.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('A valid email is required.');
    if (!message) errors.push('Tell us a little about your project.');

    if (errors.length) {
      setStatus(statusEl, errors.join(' '), 'error');
      return;
    }

    button.disabled = true;
    button.textContent = 'Sending\u2026';
    setStatus(statusEl, 'Sending your message\u2026', 'info');

    try {
      await withTimeout(
        sendContactInquiryEmail({
          from_name: name,
          from_email: email,
          company: (data.get('company') || '').toString().trim(),
          interest: (data.get('interest') || '').toString().trim(),
          message,
        }),
        15000,
        'Sending your message'
      );

      form.reset();
      button.textContent = 'Message sent';
      setStatus(statusEl, 'Message sent \u2014 we\u2019ll be in touch soon.', 'success');
      setTimeout(() => {
        button.textContent = originalBtnText;
        button.disabled = false;
      }, 2200);
    } catch (err) {
      setStatus(
        statusEl,
        `We couldn\u2019t send that (${err.message}). Please try again, or email tonymuthai@gmail.com or call +254 757 310 308.`,
        'error'
      );
      button.textContent = originalBtnText;
      button.disabled = false;
    }
  });
}
