import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  apiKey: "AIzaSyC2IfR_PbWwIhosCj1gCN5RqD2lmbzIfoI",
  authDomain: "online-daw-backup2.firebaseapp.com",
  projectId: "online-daw-backup2",
  storageBucket: "online-daw-backup2.appspot.com",
  messagingSenderId: "758641612786",
  appId: "1:758641612786:web:6485af2b3cf39c72b37d6b",
  databaseURL: "gs://online-daw-backup2.appspot.com",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);
