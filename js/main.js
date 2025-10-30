// js/main.js
// Handles dashboard populate and navbar login/profile UI.
// Requires js/firebase-auth.js (auth, onAuthStateChanged, signOutUser, getUserAggregated)

import { auth, onAuthStateChanged, signOutUser, getUserAggregated } from './firebase-auth.js';

const loginBtn = document.getElementById('login-btn');
const profileWrap = document.getElementById('profile-wrap');
const profileMenu = document.getElementById('profile-menu');
const profilePic = document.getElementById('profile-pic');

function showLoggedOutUI() {
  if (loginBtn) loginBtn.classList.remove('hidden');
  if (profileWrap) profileWrap.classList.add('hidden');
}

function showLoggedInUI(user) {
  if (loginBtn) loginBtn.classList.add('hidden');
  if (profileWrap) {
    profileWrap.classList.remove('hidden');
    profilePic.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'U')}&background=0D8ABC&color=fff`;
  }
  // populate dashboard if on index
  populateDashboard(user.uid);
}

async function populateDashboard(uid) {
  // Update progress bars and last scores
  try {
    const data = await getUserAggregated(uid);
    // default zeros
    const htmlLast = document.getElementById('html-last');
    const cssLast = document.getElementById('css-last');
    const jsLast = document.getElementById('js-last');
    const htmlProg = document.getElementById('html-progress');
    const cssProg = document.getElementById('css-progress');
    const jsProg = document.getElementById('js-progress');
    const attemptList = document.getElementById('attempt-list');

    if (!data || !data.quizProgress) {
      if (htmlLast) htmlLast.textContent = '—';
      if (cssLast) cssLast.textContent = '—';
      if (jsLast) jsLast.textContent = '—';
      if (htmlProg) htmlProg.style.width = '0%';
      if (cssProg) cssProg.style.width = '0%';
      if (jsProg) jsProg.style.width = '0%';
      if (attemptList) attemptList.innerHTML = '<li class="muted">No attempts yet.</li>';
      return;
    }

    const q = data.quizProgress;
    if (q.html) {
      if (htmlLast) htmlLast.textContent = `${q.html.score}/${q.html.score ? q.html.score : 0}`; // score only stored, display actual number via attempts if needed
      if (htmlProg) htmlProg.style.width = (q.html.progress || 0) + '%';
      if (htmlLast && q.html.score !== undefined) htmlLast.textContent = `${q.html.score}/${q.html.score ? q.html.score : '—'}`;
    } else {
      if (htmlLast) htmlLast.textContent = '—';
      if (htmlProg) htmlProg.style.width = '0%';
    }

    if (q.css) {
      if (cssLast) cssLast.textContent = `${q.css.score}/${q.css.score ? q.css.score : '—'}`;
      if (cssProg) cssProg.style.width = (q.css.progress || 0) + '%';
    } else {
      if (cssLast) cssLast.textContent = '—';
      if (cssProg) cssProg.style.width = '0%';
    }

    if (q.js) {
      if (jsLast) jsLast.textContent = `${q.js.score}/${q.js.score ? q.js.score : '—'}`;
      if (jsProg) jsProg.style.width = (q.js.progress || 0) + '%';
    } else {
      if (jsLast) jsLast.textContent = '—';
      if (jsProg) jsProg.style.width = '0%';
    }

    // show recent attempts (we don't query attempts here to keep reads minimal)
    if (attemptList) {
      attemptList.innerHTML = '<li class="muted">Recent attempts appear after you complete a quiz.</li>';
    }
  } catch (err) {
    console.error('Failed to load user aggregated data', err);
  }
}

/* Event wiring for navbar */
if (loginBtn) {
  loginBtn.addEventListener('click', () => {
    // go to login page
    window.location.href = 'login.html';
  });
}

if (profileWrap) {
  profileWrap.addEventListener('click', (e) => {
    profileMenu.classList.toggle('hidden');
  });
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await signOutUser();
    showLoggedOutUI();
    // redirect to dashboard
    window.location.href = 'index.html';
  });
}

/* Protect quiz pages: if user is not authenticated, redirect to login.
   Also update navbar visibility across pages. */
onAuthStateChanged(user => {
  const path = location.pathname;
  const isQuizPage = path.includes('/pages/') && path.endsWith('-quiz.html');
  if (user) {
    showLoggedInUI(user);
  } else {
    showLoggedOutUI();
    if (isQuizPage) {
      // add redirect back param so user can come back after login
      const dest = encodeURIComponent(location.pathname + location.search);
      window.location.href = '/login.html?redirect=' + dest;
    }
  }
});
