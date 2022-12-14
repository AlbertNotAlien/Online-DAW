import styled from "styled-components";
import Link from "next/link";
import Image from "next/image";
import Avatar from "boring-avatars";
import { useAuth } from "../../context/AuthContext";

const Container = styled.div`
  height: 50px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0px 20px;
  align-items: center;
`;

const Logo = styled.div`
  position: relative;
`;

const Profile = styled.div``;

const Header = () => {
  const { user } = useAuth();

  return (
    <>
      <Container>
        <Link href="/">
          <Logo>
            <Image
              src="/logo-combine.svg"
              alt="logo"
              width={84.084 * 1.5}
              height={22.555 * 1.5}
            />
          </Logo>
        </Link>
        <Link href="/profile">
          <Profile>
            {user ? (
              <Avatar size={30} name="Willa Cather" variant="beam" />
            ) : (
              <Image src="/profile.svg" alt="profile" width={30} height={30} />
            )}
          </Profile>
        </Link>
      </Container>
    </>
  );
};

export default Header;
