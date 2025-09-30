// src/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "AIzaSyBn1Gz9lNnHudiClQBk3cQLrpwmdy_QreM",
  authDomain: "xtreme-rindegastos.firebaseapp.com",
  projectId: "xtreme-rindegastos",
  storageBucket: "xtreme-rindegastos.appspot.com",
  messagingSenderId: "351951671615",
  appId: "1:351951671615:web:5efe868bb54389f78c038a",
  measurementId: "G-4VFJKLH0RF"
}

// instancia única
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app) // opcional
