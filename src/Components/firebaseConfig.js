import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBVC6OJzcSfiUA0xTycnPLjxIHOEsiMtkc",
  authDomain: "workerpower-4d307.firebaseapp.com",
  projectId: "workerpower-4d307",
  storageBucket: "workerpower-4d307.firebasestorage.app",
  messagingSenderId: "247037410486",
  appId: "1:247037410486:web:99ba23195fce80803afa17",
  measurementId: "G-NKPGY6P98H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };