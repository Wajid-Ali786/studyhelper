# StudyHelper — GitHub Pages + Firebase quiz site

This repo contains a simple StudyHelper quiz site built with plain HTML, CSS and vanilla JavaScript. It uses Firebase Authentication and Firestore client-side for user accounts and storing quiz attempts.

## Files included
- `index.html` — Dashboard
- `login.html` — Sign in / Sign up (in repo root)
- `pages/html-quiz.html`, `pages/css-quiz.html`, `pages/js-quiz.html` — Quiz pages
- `css/style.css` — Styles
- `js/firebase-auth.js` — Firebase initialization and auth helpers (place your `firebaseConfig` here)
- `js/main.js` — Dashboard and navbar logic
- `js/quiz.js` — Generic quiz runner
- `data/*.json` — Local question banks (HTML, CSS, JS)

## Quick setup (Firebase console)
1. Create a Firebase project at https://console.firebase.google.com.
2. In **Build → Authentication**, enable **Email/Password** (and optionally Google sign-in under Sign-in methods).
3. In **Build → Firestore Database**, create a database (start in **test mode** while developing).
4. In **Project settings → Your apps**, add a Web app and copy the Firebase SDK config object (the `firebaseConfig` object).
5. Open `js/firebase-auth.js` and replace the placeholder `firebaseConfig` object with your actual values.

## Firestore structure used
- `users/{uid}` — per-user aggregated data:
  - `email`, `createdAt`, `roles`, `quizProgress` (object with keys `html`, `css`, `js`)
- `attempts` — each document is a quiz attempt:
  - `userId`, `subject`, `questionIds`, `answers`, `score`, `maxScore`, `durationSeconds`, `createdAt`

## Example Firestore rules (very important)
Place these rules in Firestore rules tab to ensure users can only write their own attempts:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read to all question data (if you ever store questions in Firestore).
    match /questions/{docId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == 'ADMIN_UID'; // optionally restrict questions
    }

    match /attempts/{attemptId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if false;
    }

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }

    // Default deny
    match /{document=**} { allow read, write: if false; }
  }
}
