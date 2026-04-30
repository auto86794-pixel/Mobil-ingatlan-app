import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDskx7vN2dcAFLJz--5ywvjE0BFCpUOUgw",
  authDomain: "albi-app-37e9d.firebaseapp.com",
  projectId: "albi-app-37e9d",
  storageBucket: "albi-app-37e9d.appspot.com",
  messagingSenderId: "56051902609",
  appId: "1:56051902609:web:2a40c06215e7d92b763730",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);