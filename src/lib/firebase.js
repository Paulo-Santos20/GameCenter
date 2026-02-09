// src/lib/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBwvKkUhiCTvhsxv2_tG94JRuJN5GwpC3k",
  authDomain: "gamec-156b7.firebaseapp.com",
  projectId: "gamec-156b7",
  storageBucket: "gamec-156b7.firebasestorage.app",
  messagingSenderId: "425379146220",
  appId: "1:425379146220:web:8c5a91ffe3f92f0d4438c9",
  measurementId: "G-QRN663CR8Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);