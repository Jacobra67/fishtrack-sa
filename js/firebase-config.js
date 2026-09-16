// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBu8k_4z-R8GDCZfqHa2K-kfkwjxA_qH8",
    authDomain: "fishtrack-sa.firebaseapp.com",
    projectId: "fishtrack-sa",
    storageBucket: "fishtrack-sa.firebasestorage.app",
    messagingSenderId: "610455904803",
    appId: "1:610455904803:web:3f04f72c5bd9644c64d336"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services
const db = firebase.firestore();

// Anonymous auth — only runs on pages that include the firebase-auth SDK script
let authReady = Promise.resolve(null);
if (firebase.auth) {
    authReady = new Promise((resolve) => {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                resolve(user);
            } else {
                firebase.auth().signInAnonymously().catch((err) => {
                    console.error('Anonymous sign-in failed:', err);
                    resolve(null);
                });
            }
        });
    });
}

console.log('Firebase initialized successfully');
