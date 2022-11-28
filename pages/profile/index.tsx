import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/router";
import styled from "styled-components";
import Image from "next/image";

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
import Link from "next/link";

const BackGround = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Container = styled.div`
  width: 500px;
  height: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 24px;
  margin: 0 auto;
  margin-top: 100px;
`;

const Logo = styled.div``;

const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
`;

const UserWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 20px;
  background-color: #585858;
  border-radius: 20px;
  width: 100%;
  height: 500px;
  padding: 50px 10px;
`;

const UserName = styled.p`
  font-size: 24px;
  font-weight: bold;
`;
const UserEmail = styled.p``;

const Button = styled.button`
  width: 480px;
  height: 40px;
  border-radius: 10px;
  border: none;
  text-transform: uppercase;
  cursor: pointer;
`;

const MembersWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  row-gap: 20px;
`;

const Member = styled.div`
  width: 100%;
  height: 80px;
  background-color: #585858;
  border-radius: 20px;
  display: flex;
  align-items: center;
  column-gap: 20px;
  padding-left: 20px;
`;

const MemberName = styled.p`
  width: 80px;
`;
const MemberEmail = styled.p`
  width: 200px;
`;
const MemberState = styled.p`
  width: 80px;
`;

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
      let newMembers: { email: string; displayName: string; state: string }[] =
        [];
      querySnapshot.forEach((doc) => {
        // console.log(doc.data());
        const email = doc.data().email;
        const displayName = doc.data().displayName;
        const state = doc.data().state;
        newMembers.push({ email, displayName, state });
      });
      newMembers = newMembers.filter((member) => member.email !== user.email);
      setMembers(newMembers);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <BackGround>
      <Header />
      <Container>
        {/* <Logo>
          <Image
            src="/logo-combine.svg"
            alt="logo"
            width={84.084 * 3}
            height={22.555 * 3}
          />
        </Logo> */}
        <Title>Profile</Title>
        <UserWrapper>
          <Avatar
            size={100}
            name="Maria Mitchell"
            variant="beam"
            colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
          />
          <UserName>{user?.displayName}</UserName>
          {/* <UserName>{user?.displayName || "Albert"}</UserName> */}
          <UserEmail>{user?.email}</UserEmail>
          <Link href={"/dashboard"}>
            <Button>dashboard</Button>
          </Link>
          <Button onClick={handleLogout}>logout</Button>
        </UserWrapper>

        <MembersWrapper>
          <div>Members</div>
          {members.map((member, index) => (
            <Member key={`${member}-${index}`}>
              <Avatar
                size={40}
                name="Maria Mitchell"
                variant="beam"
                colors={["#92A1C6", "#146A7C", "#F0AB3D", "#C271B4", "#C20D90"]}
              />
              <MemberName>{member.displayName}</MemberName>
              <MemberEmail>{member.email}</MemberEmail>
              <MemberState>{member.state}</MemberState>
            </Member>
          ))}
        </MembersWrapper>
      </Container>
    </BackGround>
  );
}
