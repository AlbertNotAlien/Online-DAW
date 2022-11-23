import { useState, useEffect } from "react";
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

  return (
    <>
      <div className="min-h-full flex flex-col justify-center items-center">
        <h1 className="font-bold text-3xl">Profile</h1>
        <div className="my-5">
          <Avatar
            size={100}
            name="Maria Mitchell"
            variant="beam"
            colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
          />
        </div>
        <div>{user?.displayName}</div>
        <div>{user?.email}</div>
        {/* <div>{`${points} ${points > 1 ? "points" : "point"}`}</div> */}
        <button
          onClick={handleLogout}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-5"
        >
          登出
        </button>
      </div>
    </>
  );
}
