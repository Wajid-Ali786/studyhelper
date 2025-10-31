# StudyHelper Quiz Website

This is a "StudyHelper" quiz application built with plain HTML, CSS, and vanilla JavaScript. It uses Firebase for user authentication and Firestore for data storage. It's designed to be hosted as a static site on services like GitHub Pages.

## 🚀 Deployment & Setup Guide

Follow these steps to get your own copy of the site up and running.

### 1. Create a Firebase Project

1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click "Add project" and give it a name (e.g., "StudyHelper").
3.  Continue through the steps to create the project.

### 2. Add Firebase to Your App

1.  In your project's "Project Overview", click the web icon (`</>`) to add a web app.
2.  Give it a "App nickname" (e.g., "StudyHelper Web").
3.  **Do NOT** check the box for "Firebase Hosting".
4.  Click "Register app".
5.  Firebase will show you a `firebaseConfig` object. **Copy this object.** It will look like this:

    ```javascript
    const firebaseConfig = {
      apiKey: "AIza...",
      authDomain: "your-project-id.firebaseapp.com",
      projectId: "your-project-id",
      storageBucket: "your-project-id.appspot.com",
      messagingSenderId: "123...",
      appId: "1:123...:web:..."
    };
    ```

### 3. Set Up `js/firebase-config.js`

1.  In your project folder, create a new file: `js/firebase-config.js`.
2.  Paste the `firebaseConfig` object you just copied into this file.

    **File: `js/firebase-config.js`**
    ```javascript
    // PASTE YOUR FIREBASE CONFIG OBJECT HERE
    const firebaseConfig = {
      apiKey: "YOUR_API_KEY",
      authDomain: "YOUR_AUTH_DOMAIN",
      projectId: "YOUR_PROJECT_ID",
      storageBucket: "YOUR_STORAGE_BUCKET",
      messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
      appId: "YOUR_APP_ID"
    };
    ```

    > **Note:** This file is listed in `.gitignore` (if you use one) to keep your keys private. For GitHub Pages, this will be public, which is normal for Firebase's client-side SDKs. Security is handled by Firestore Rules (Step 5).

### 4. Enable Firebase Authentication

1.  In the Firebase Console, go to **Authentication** (in the "Build" menu).
2.  Click "Get started".
3.  Go to the **Sign-in method** tab.
4.  Enable **Email/Password**.
5.  (Optional) Enable **Google**.
    * Click "Google" -> "Enable".
    * Select a "Project support email".
    * Click "Save".

### 5. Set Up Firestore Database

1.  In the Firebase Console, go to **Firestore Database** (in the "Build" menu).
2.  Click "Create database".
3.  Start in **Test mode**. This allows all reads/writes while you build.
4.  Choose a location for your database (e.g., `us-central`).
5.  Click "Enable".

6.  **IMPORTANT: Add Security Rules**
    Once your app is working, go to the **Rules** tab in Firestore and replace the test rules with these. These rules ensure users can only read/write their *own* data.

    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        // Allow users to read and write only their own user document
        match /users/{userId} {
          allow read, update, write: if request.auth != null && request.auth.uid == userId;
        }
        // Allow users to read and write only their own quiz history
        match /users/{userId}/quizHistory/{attemptId} {
          allow read, write, create: if request.auth != null && request.auth.uid == userId;
        }
      }
    }
    ```

### 6. Deploy to GitHub Pages

1.  Create a new repository on GitHub (e.g., "study-helper").
2.  Upload all your files (including `index.html`, `css/`, `js/`, `pages/`, `data/`) to this repository.
3.  In your repository's **Settings** tab, go to the **Pages** section.
4.  Under "Branch", select `main` (or `master`) and `/ (root)`.
5.  Click **Save**.
6.  Your site will be live at `https://<your-username>.github.io/<your-repo-name>/` in a few minutes.

    **NOTE:** GitHub Pages might take a minute to update. If you get a 404 error, wait and refresh.