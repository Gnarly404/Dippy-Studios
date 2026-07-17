// ---------------------------------------------------------------------------
// Firebase config (creator applications + storage)
// ---------------------------------------------------------------------------
// From the Firebase console: Project settings > General > Your apps > SDK
// setup and configuration > Config. See FIREBASE_SETUP.md for the full
// walkthrough (free "Spark" plan is enough — no billing card required).
export const FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

// Firestore collection that holds creator applications.
export const CREATORS_COLLECTION = 'creators';

// ---------------------------------------------------------------------------
// EmailJS config (sends the "new submission" / "new inquiry" notification
// emails to Dippy Studios directly from the browser — no server needed)
// ---------------------------------------------------------------------------
// From emailjs.com dashboard: Account > General (Public Key), Email Services
// (Service ID), Email Templates (Template ID). See FIREBASE_SETUP.md.
export const EMAILJS_PUBLIC_KEY = 'REPLACE_ME';
export const EMAILJS_SERVICE_ID = 'REPLACE_ME';
export const EMAILJS_CREATOR_TEMPLATE_ID = 'REPLACE_ME'; // new creator application
export const EMAILJS_CONTACT_TEMPLATE_ID = 'REPLACE_ME'; // contact form inquiry

// Email address that should receive notifications (used as a template
// variable — set the "To email" in each EmailJS template to this same
// address, or hardcode it there instead).
export const NOTIFY_EMAIL = 'hello@dippystudios.com';
