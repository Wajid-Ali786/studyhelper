/**
 * This is your new central Firebase logic file.
 * Place this file inside your 'js/' directory.
 * It will be imported by 'login.html', 'index.html', and all quiz pages.
 */

// --- Firebase SDK Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: "AIzaSyDXZZVwU6Q8l5GtK8ngxfIkQLEVkbihNhM",
    authDomain: "studyhelper-quizzes.firebaseapp.com",
    projectId: "studyhelper-quizzes",
    storageBucket: "studyhelper-quizzes.firebasestorage.app",
    messagingSenderId: "217416839389",
    appId: "1:217416839389:web:060ca955eaa8befce12b34",
    measurementId: "G-4XVEYVNL7L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Core Authentication State Listener ---
// This listener runs on EVERY page that imports this file.
onAuthStateChanged(auth, async (user) => {
    const onLoginPage = window.location.pathname.endsWith('login.html');
    // Check if we are in any sub-directory (like /pages/)
    const inPagesDir = window.location.pathname.includes('/pages/');

    if (user) {
        // --- User is LOGGED IN ---
        
        // 1. Ensure Firestore document exists
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (!docSnap.exists()) {
            console.log('New user detected, creating Firestore doc:', user.uid);
            try {
                await setDoc(userDocRef, {
                    name: user.displayName || 'New User',
                    email: user.email,
                    quizProgress: {},
                    scores: {}
                });
            } catch (error) {
                console.error("Error creating new user document:", error);
            }
        }

        // 2. Handle Redirects
        if (onLoginPage) {
            // We are on the login page, but logged in. Redirect to index.
            // (Path is relative from /pages/login.html to /index.html)
            window.location.href = '../index.html'; 
        } else {
            // We are on a content page (index.html, html-quiz.html, etc.)
            // Fire an event to let the page know it's safe to load user data.
            console.log('User is ready:', user.uid);
            window.dispatchEvent(new CustomEvent('user-ready', { detail: { user } }));
        }

    } else {
        // --- User is LOGGED OUT ---
        
        // 1. Handle Redirects
        if (!onLoginPage) {
            // We are NOT on the login page, and we are logged out.
            // Redirect *to* the login page.
            if (inPagesDir) {
                // We are in /pages/ (e.g., html-quiz.html), go to login.html
                window.location.href = 'login.html';
            } else {
                // We are in the root (index.html), go to pages/login.html
                window.location.href = 'pages/login.html';
            }
        }
    }
});


// --- Authentication Functions (for login.html) ---

/**
 * Signs up a new user with email and password.
 */
export const handleEmailSignup = async (email, password, name) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the new user's profile with their name
    await updateProfile(user, { displayName: name });
    
    // Create an initial document for them in Firestore
    const userData = {
        name: name,
        email: user.email,
        quizProgress: {},
        scores: {}
    };
    
    // We pass the UID directly to avoid any race conditions.
    await saveUserData(userData, user.uid); 
    
    return userCredential;
};

/**
 * Logs in an existing user with email and password.
 */
export const handleEmailLogin = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Logs out the current user.
 */
export const handleLogout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle the redirect
};


// --- Firestore Data Functions (for quiz pages, index.html) ---

/**
 * Saves partial or full data to the user's Firestore document.
 * @param {Object} dataToSave - An object of data to merge. e.g., { name: "New Name" }
 * @param {string} [uid] - Optional UID. If not provided, defaults to auth.currentUser.uid.
 */
export const saveUserData = async (dataToSave, uid) => {
    const userId = uid || auth.currentUser?.uid; 
    
    if (!userId) {
        console.error("No user ID found. User might be logged out.");
        return;
    }
    
    const userDocRef = doc(db, 'users', userId);
    
    try {
        // Use { merge: true } to only update fields in dataToSave
        // and not overwrite the whole document.
        await setDoc(userDocRef, dataToSave, { merge: true });
        console.log("Data saved for user:", userId, dataToSave);
    } catch (error) {
        console.error("Error saving user data:", error);
    }
};

/**
 * Loads the current user's entire data document from Firestore.
 * @returns {Object|null} The user's data object, or null if not found.
 */
export const loadUserData = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
        console.error("No user ID found to load data.");
        return null;
    }

    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        console.warn("No user document found in Firestore for user:", userId);
        return null;
    }
};