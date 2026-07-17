import { qs, qsa } from './core/utilities.js';
import {
  getDb,
  getAuthInstance,
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from './core/firebaseClient.js';
import { CREATORS_COLLECTION } from './core/config.js';

function setStatus(el, message, tone) {
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone || '';
  el.hidden = !message;
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

let currentTab = 'pending';

async function loadApplications() {
  const grid = qs('[data-applications-grid]');
  const listStatus = qs('[data-list-status]');
  setStatus(listStatus, 'Loading…', 'info');
  grid.innerHTML = '';

  try {
    const q = query(
      collection(getDb(), CREATORS_COLLECTION),
      where('status', '==', currentTab),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      setStatus(listStatus, `No ${currentTab} applications right now.`, 'info');
      return;
    }
    setStatus(listStatus, '', '');

    grid.innerHTML = snap.docs
      .map((d) => {
        const c = d.data();
        const socials = c.socials || {};
        const socialLine = Object.entries(socials)
          .filter(([, v]) => v)
          .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(v)}`)
          .join(' · ');

        return `
        <article class="admin-card admin-application" data-id="${d.id}">
          <img src="${escapeHtml(c.photo)}" alt="${escapeHtml(c.name)}" class="admin-application__photo">
          <div class="admin-application__body">
            <h3>${escapeHtml(c.name)}</h3>
            <p class="mono-label">${escapeHtml(c.email)} ${c.phone ? '· ' + escapeHtml(c.phone) : ''}</p>
            <p class="mono-label">${escapeHtml(c.niche)} · ${escapeHtml(c.followers)} followers</p>
            <p>${escapeHtml(c.bio)}</p>
            ${socialLine ? `<p class="mono-label">${socialLine}</p>` : ''}
          </div>
          <div class="admin-application__actions">
            ${currentTab !== 'approved' ? '<button type="button" class="btn btn--primary btn--sm" data-action="approved">Approve</button>' : ''}
            ${currentTab !== 'rejected' ? '<button type="button" class="btn btn--ghost btn--sm" data-action="rejected">Reject</button>' : ''}
            <button type="button" class="btn btn--ghost btn--sm" data-action="delete">Delete</button>
          </div>
        </article>`;
      })
      .join('');
  } catch (err) {
    setStatus(listStatus, `Couldn\u2019t load applications: ${err.message}`, 'error');
  }
}

function bindGridActions() {
  const grid = qs('[data-applications-grid]');
  grid.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const card = btn.closest('[data-id]');
    const id = card.dataset.id;
    const action = btn.dataset.action;

    btn.disabled = true;
    try {
      if (action === 'delete') {
        if (!confirm('Delete this application permanently?')) { btn.disabled = false; return; }
        await deleteDoc(doc(getDb(), CREATORS_COLLECTION, id));
      } else {
        await updateDoc(doc(getDb(), CREATORS_COLLECTION, id), { status: action });
      }
      card.remove();
    } catch (err) {
      alert(`That didn\u2019t work: ${err.message}`);
      btn.disabled = false;
    }
  });
}

function bindTabs() {
  qsa('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      qsa('.admin-tab').forEach((t) => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentTab = tab.dataset.tab;
      loadApplications();
    });
  });
}

function showApp() {
  qs('[data-login-panel]').hidden = true;
  qs('[data-app-panel]').hidden = false;
  qs('[data-signout-btn]').hidden = false;
  loadApplications();
}

function showLogin() {
  qs('[data-login-panel]').hidden = false;
  qs('[data-app-panel]').hidden = true;
  qs('[data-signout-btn]').hidden = true;
}

function initAuth() {
  const auth = getAuthInstance();
  const loginForm = qs('[data-login-form]');
  const loginStatus = qs('[data-login-status]');
  const signOutBtn = qs('[data-signout-btn]');

  onAuthStateChanged(auth, (user) => {
    if (user) showApp();
    else showLogin();
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(loginForm);
    const email = (data.get('email') || '').toString().trim();
    const password = (data.get('password') || '').toString();

    setStatus(loginStatus, 'Signing in…', 'info');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setStatus(loginStatus, `Couldn\u2019t sign in: ${err.message}`, 'error');
    }
  });

  signOutBtn.addEventListener('click', () => signOut(auth));
}

initAuth();
bindTabs();
bindGridActions();
