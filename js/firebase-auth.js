// js/firebase-auth.js
// Firebase initialization and auth helper functions (ES module).
// IMPORTANT: Replace the firebaseConfig object below with your project's config
// from Firebase Console (Project settings -> SDK snippet).

export let auth = null;
export let db = null;

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged as fbOnAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

/* ======= PASTE YOUR FIREBASE CONFIG HERE =======
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};
================================================= */
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

const app = initializeApp(firebaseConfig);
auth = getAuth(app);
db = getFirestore(app);

/* Helper: wrap onAuthStateChanged so other modules can import it */
export function onAuthStateChanged(cb) {
  return fbOnAuthStateChanged(auth, async (user) => {
    cb(user);
  });
}

/* Email/password sign-in */
export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred;
}

/* Email/password sign-up: creates a users/{uid} doc if needed */
export async function signUpWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  // create basic user doc
  const userRef = doc(db, 'users', cred.user.uid);
  const exists = await getDoc(userRef);
  if (!exists.exists()) {
    await setDoc(userRef, {
      email: email,
      createdAt: serverTimestamp(),
      roles: { user: true }, // admin can be added manually in DB (roles.admin = true)
      quizProgress: { html: {}, css: {}, js: {} }
    });
  }
  return cred;
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  // ensure user doc exists
  const userRef = doc(db, 'users', cred.user.uid);
  const exists = await getDoc(userRef);
  if (!exists.exists()) {
    await setDoc(userRef, {
      email: cred.user.email,
      displayName: cred.user.displayName || null,
      createdAt: serverTimestamp(),
      roles: { user: true },
      quizProgress: { html: {}, css: {}, js: {} }
    });
  }
  return cred;
}

/* Sign out */
export async function signOutUser() {
  await fbSignOut(auth);
}

/* Save attempt object to Firestore and update users/{uid} aggregated progress */
export async function saveAttemptAndUpdateUser(uid, attempt) {
  // attempt: { subject, questionIds, answers, score, maxScore, durationSeconds, createdAt }
  // add to attempts collection
  const attemptsRef = collection(db, 'attempts');
  const added = await addDoc(attemptsRef, {
    ...attempt,
    userId: uid,
    createdAt: serverTimestamp()
  });

  // update user aggregated doc
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  let userData = {};
  if (userSnap.exists()) userData = userSnap.data();
  const subject = attempt.subject;
  const lastAttemptDate = new Date().toISOString();
  const progress = Math.round((attempt.score / attempt.maxScore) * 100);

  const newQuizProgress = Object.assign({}, userData.quizProgress || {}, {
    [subject]: {
      score: attempt.score,
      lastAttemptDate,
      progress
    }
  });

  await setDoc(userRef, {
    ...userData,
    quizProgress: newQuizProgress,
    updatedAt: serverTimestamp()
  }, { merge: true });

  return added.id;
}

/* Utility: load user aggregated data */
export async function getUserAggregated(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export { getDoc, doc, setDoc, updateDoc, collection, getDocs, query, where, addDoc };
