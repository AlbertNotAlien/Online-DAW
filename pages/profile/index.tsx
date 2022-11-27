import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../config/firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import Avatar from "boring-avatars";
import Header from "../../components/Header";

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [points, setPoints] = useState(0);

  const handleLogout = async () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, []);

  // useEffect(() => {
  //   const getPoints = async () => {
  //     const docRef = doc(db, "users", user.uid);
  //     const docSnap = await getDoc(docRef);
  //     if (docSnap.exists()) {
  //       setPoints(docSnap.data().points);
  //     } else {
  //       console.log("No such document!");
  //     }
  //   };
  //   getPoints();
  // }, []);

  const [members, setMembers] = useState<
    {
      email: string;
      displayName: string;
      state: string;
    }[]
  >([]);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("last_changed", "desc"),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log(querySnapshot);
      let newMembers: { email: string; displayName: string; state: string }[] =
        [];
      querySnapshot.forEach((doc) => {
        console.log(doc.data());
        const email = doc.data().email;
        const displayName = doc.data().displayName;
        const state = doc.data().state;
        newMembers.push({ email, displayName, state });
        setMembers(newMembers);
      });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  console.log(members);

  return (
    <>
      <Header />

      <Avatar
        size={100}
        name="Maria Mitchell"
        variant="beam"
        colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
      />
      <div>{user?.displayName}</div>
      <div>{user?.email}</div>
      <button
        onClick={handleLogout}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
      >
        登出
      </button>

      {members.map((member, index) => (
        <div key={`${member}-${index}`}>
          <Avatar
            size={40}
            name="Maria Mitchell"
            variant="beam"
            colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
          />
          <div>{member.email}</div>
          <div>{member.state}</div>
        </div>
      ))}
    </>
  );
}
