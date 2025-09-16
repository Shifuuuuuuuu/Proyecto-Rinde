import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBn1Gz9lNnHudiClQBk3cQLrpwmdy_QreM",
  authDomain: "xtreme-rindegastos.firebaseapp.com",
  projectId: "xtreme-rindegastos",
  storageBucket: "xtreme-rindegastos.firebasestorage.app",
  messagingSenderId: "351951671615",
  appId: "1:351951671615:web:5efe868bb54389f78c038a",
  measurementId: "G-4VFJKLH0RF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
