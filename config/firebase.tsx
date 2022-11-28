import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_API_KEY_1,
  authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN_1,
  databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL_1,
  projectId: process.env.NEXT_PUBLIC_PROJECT_ID_1,
  storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET_1,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID_1,
  appId: process.env.NEXT_PUBLIC_APP_ID_1,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
