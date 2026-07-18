// Central Firebase initializer. Uses the hosted modular SDK straight from
// Google's CDN (gstatic) — no npm install / build step needed, matching the
// rest of this static site.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

import { FIREBASE_CONFIG } from './config.js';

let app;
let db;
let auth;

function ensureInit() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    // This project's Firestore database was created with the custom ID
    // "dippy-studios" rather than being left as "(default)" — pass it
    // explicitly, since getFirestore(app) with no second argument only
    // ever looks for a database literally named "(default)".
    db = getFirestore(app, 'dippy-studios');
    auth = getAuth(app);
  }
  return { app, db, auth };
}

export function isFirebaseConfigured() {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== 'REPLACE_ME');
}

export function getDb() {
  return ensureInit().db;
}

export function getAuthInstance() {
  return ensureInit().auth;
}

export {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
};
