// Thin wrapper around the EmailJS browser SDK (loaded globally via
// <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js">
// in each page's <head>). Sends notification emails straight from the
// browser — no backend function or billing account required.
import {
  EMAILJS_PUBLIC_KEY,
  EMAILJS_SERVICE_ID,
  EMAILJS_CREATOR_TEMPLATE_ID,
  EMAILJS_CONTACT_TEMPLATE_ID,
  NOTIFY_EMAIL,
} from './config.js';

let initialized = false;

function ensureInit() {
  if (!initialized && window.emailjs) {
    window.emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    initialized = true;
  }
}

export function isEmailConfigured() {
  return Boolean(
    EMAILJS_PUBLIC_KEY &&
      EMAILJS_PUBLIC_KEY !== 'REPLACE_ME' &&
      EMAILJS_SERVICE_ID &&
      EMAILJS_SERVICE_ID !== 'REPLACE_ME'
  );
}

async function send(templateId, templateParams) {
  if (!window.emailjs) throw new Error('EmailJS script did not load.');
  ensureInit();
  try {
    return await window.emailjs.send(EMAILJS_SERVICE_ID, templateId, {
      to_email: NOTIFY_EMAIL,
      ...templateParams,
    });
  } catch (err) {
    // EmailJS rejects with a plain object like { status, text }, not a
    // real Error, so err.message is normally undefined. Surface whatever
    // it actually gave us instead.
    const reason =
      (err && err.text) ||
      (err && err.message) ||
      (err && err.status && `EmailJS error ${err.status}`) ||
      (typeof err === 'string' ? err : null) ||
      JSON.stringify(err);
    console.error('EmailJS send failed:', err);
    throw new Error(reason);
  }
}

export function sendCreatorApplicationEmail(fields) {
  return send(EMAILJS_CREATOR_TEMPLATE_ID, fields);
}

export function sendContactInquiryEmail(fields) {
  return send(EMAILJS_CONTACT_TEMPLATE_ID, fields);
}
