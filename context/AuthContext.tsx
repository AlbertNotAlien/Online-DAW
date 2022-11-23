import { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  set,
  onDisconnect,
  serverTimestamp,
  ref,
  onValue,
  push,
} from "firebase/database";
import { db, auth, firebaseConfig } from "../config/firebase";

import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useState } from "react";

const AuthContext = createContext<any>({});

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [user, setUser] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: res.user.displayName,
      });
    }
    const docRef = doc(db, "users", res.user.uid);
    await setDoc(docRef, {
      id: res.user.uid,
      displayName: res.user.displayName,
      email: email,
      state: "online",
    });
    await router.push("/profile");
  };

  const signin = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await router.push("/profile");
    const docRef = doc(db, "users", res.user.uid);
    await setDoc(docRef, {
      state: "online",
    });
  };

  const logout = async () => {
    setUser(null);
    alert("已登出");
    const res = await signOut(auth);
    console.log(res);
  };

  // connect to realtime database
  useEffect(() => {
    if (!user?.uid) return;

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const userStatusDatabaseRef = ref(db, "/status/" + user.uid);

    var isOfflineForDatabase = {
      state: "offline",
      last_changed: serverTimestamp(),
    };

    var isOnlineForDatabase = {
      state: "online",
      last_changed: serverTimestamp(),
    };

    console.log(user?.uid);
    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
      console.log(snap);
      if (snap.val() === true) {
        onDisconnect(userStatusDatabaseRef)
          .set(isOfflineForDatabase)
          .then(function () {
            set(userStatusDatabaseRef, isOnlineForDatabase);
          });
      }
    });
  }, [user?.uid]);

  return (
    <AuthContext.Provider value={{ user, signin, signup, logout }}>
      {loading ? null : children}
    </AuthContext.Provider>
  );
};
