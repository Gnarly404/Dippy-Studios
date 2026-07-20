// ---------------------------------------------------------------------------
// Firebase config (creator applications + storage)
// ---------------------------------------------------------------------------
// From the Firebase console: Project settings > General > Your apps > SDK
// setup and configuration > Config. See FIREBASE_SETUP.md for the full
// walkthrough (free "Spark" plan is enough — no billing card required).
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyC6Q8kVTnG_x2G_FKICDhzh_YLp-G1GzDY',
  authDomain: 'dippy-studios.firebaseapp.com',
  projectId: 'dippy-studios',
  storageBucket: 'dippy-studios.firebasestorage.app',
  messagingSenderId: '612995823560',
  appId: '1:612995823560:web:673293d336ab3f70e7f2fd',
};

// Firestore collection that holds creator applications.
export const CREATORS_COLLECTION = 'creators';

// Firestore collections for admin-managed homepage content.
export const BRANDS_COLLECTION = 'brands';
export const CAMPAIGNS_COLLECTION = 'campaigns';
export const TESTIMONIALS_COLLECTION = 'testimonials';

// ---------------------------------------------------------------------------
// EmailJS config (sends the "new submission" / "new inquiry" notification
// emails to Dippy Studios directly from the browser — no server needed)
// ---------------------------------------------------------------------------
// From emailjs.com dashboard: Account > General (Public Key), Email Services
// (Service ID), Email Templates (Template ID). See FIREBASE_SETUP.md.
export const EMAILJS_PUBLIC_KEY = 'Oo4izfPiCQW53Zawe';
export const EMAILJS_SERVICE_ID = 'service_h54p865';
export const EMAILJS_CREATOR_TEMPLATE_ID = 'template_6591ona'; // new creator application
export const EMAILJS_CONTACT_TEMPLATE_ID = 'template_9k6314b'; // contact form inquiry
export const EMAILJS_TESTIMONIAL_TEMPLATE_ID = 'REPLACE_ME'; // new client testimonial submitted for review

// Email address that should receive notifications (used as a template
// variable — set the "To email" in each EmailJS template to this same
// address, or hardcode it there instead).
export const NOTIFY_EMAIL = 'workwithgnarly@gmail.com';
