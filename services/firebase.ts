import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBXXaWWoFqn6MpH6IWSm6CGaqUJzAmzbzA",
  authDomain: "dopamine-quiz.firebaseapp.com",
  projectId: "dopamine-quiz",
  storageBucket: "dopamine-quiz.firebasestorage.app",
  messagingSenderId: "822531459966",
  appId: "1:822531459966:web:8e7d2385090e997eb1c12f",
  measurementId: "G-6TWRMVGB18"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;