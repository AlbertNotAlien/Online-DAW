import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/router";
import {
  updateProfile,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  set,
  onDisconnect,
  serverTimestamp,
  ref,
  onValue,
} from "firebase/database";
import { db, auth, firebaseConfig } from "../config/firebase";

interface UserType {
  uid: string;
  email: string;
  displayName: string;
}

interface CreateContextType {
  user: UserType | null;
  isLoadingLogin: boolean;
  login: Function;
  signup: Function;
  logout: Function;
}

const AuthContext = createContext<CreateContextType>({} as CreateContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingLogin, setIsLoadingLogin] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser({
          uid: user.uid,
          email: user.email as string,
          displayName: user.displayName as string,
        });
      } else {
        setUser(null);
      }
      setIsLoadingLogin(false);
    });
    return () => unsubscribe();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    console.log("displayName", displayName);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        displayName: displayName,
      });
    }

    setUser({
      uid: res.user.uid,
      email: res.user.email as string,
      displayName: displayName,
    });

    const docRef = doc(db, "users", res.user.uid);
    await setDoc(docRef, {
      id: res.user.uid,
      displayName: displayName,
      email: email,
      state: "online",
    });
    await router.push("/profile");
  };

  const login = async (email: string, password: string) => {
    const res = await signInWithEmailAndPassword(auth, email, password);
    await router.push("/profile");
    const docRef = doc(db, "users", res.user.uid);
    await updateDoc(docRef, {
      state: "online",
    });
  };

  const logout = async () => {
    alert("已登出");
    await signOut(auth);

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const userStatusDatabaseRef = ref(db, "/status/" + user?.uid);

    const isOfflineForDatabase = {
      state: "offline",
      last_changed: serverTimestamp(),
    };
    set(userStatusDatabaseRef, isOfflineForDatabase);

    setUser(null);
  };

  // connect to realtime database
  useEffect(() => {
    if (!user?.uid) return;

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);
    const userStatusDatabaseRef = ref(db, "/status/" + user.uid);

    const isOfflineForDatabase = {
      state: "offline",
      last_changed: serverTimestamp(),
    };

    const isOnlineForDatabase = {
      state: "online",
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(db, ".info/connected");
    onValue(connectedRef, (snap) => {
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
    <AuthContext.Provider
      value={{ user, isLoadingLogin, login, signup, logout }}
    >
      {isLoadingLogin ? null : children}
    </AuthContext.Provider>
  );
};
