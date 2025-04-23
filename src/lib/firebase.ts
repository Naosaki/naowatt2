// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDJoTgWwKPKlXbhGktvy-NhEvjSBv_Vgg",
  authDomain: "datawatt.firebaseapp.com",
  projectId: "datawatt",
  storageBucket: "datawatt.firebasestorage.app",
  messagingSenderId: "845505924996",
  appId: "1:845505924996:web:7b9894136bf67cd1dd97d1"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
