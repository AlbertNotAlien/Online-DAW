import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import Footer from "../src/components/Footer";
import Header from "../src/components/Header";

const Window = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  /* align-items: center; */
  background-image: url("/demo-background.png");
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  /* opacity: 50%; */
`;

const Container = styled.div`
  max-width: 1280px;
  /* min-height: 100%; */
  padding: 20px 0px;
  display: flex;
  flex-direction: column;
  margin: 0px auto;
`;

const Title = styled.h1`
  font-size: 120px;
  font-weight: 700;
  color: #f6ddcd;
  /* margin-top: 100px; */
  transform: translateX(-20px);
  margin: 80px 0px;
`;

const SubTitle = styled.h1`
  font-size: 30px;
  font-weight: 700;
  color: #f6ddcd;
  margin-top: 30px;
`;

const Description = styled.p`
  font-size: 16px;
  width: 70%;
  color: #f6ddcd;
  margin-top: 20px;
  margin-bottom: 80px;
`;

const Links = styled.div`
  display: flex;
  /* margin-top: 100px; */
  bottom: 0px;
  column-gap: 200px;
`;

const LinkText = styled.p`
  font-size: 18px;
  /* font-weight: 700; */
  color: #f6ddcd;
  /* margin-top: 50px; */
  &:hover {
    text-decoration: underline;
    text-underline-offset: 5px;
  }
`;

const DemoBlocks = styled.div`
  display: flex;
  column-gap: 50px;
  width: 100%;
  /* justify-content: space-between; */
`;

const DemoBlock = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #4d4d4d;
  width: ${192 * 1.5}px;
  min-height: ${108 * 2.2}px;
  border-radius: 10px;
  overflow: hidden;
`;

const DemoContent = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  padding: 10px;
`;

const DemoContentTitle = styled.p`
  font-size: 16px;
  font-weight: bold;
`;

const DemoContentDescription = styled.p`
  font-size: 10px;
  /* font-weight: bold; */
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  transform: translateX(-60px);
`;

const Titles = styled.div`
  display: flex;
  flex-direction: column;
  /* row-gap: 50px; */
`;

export default function Home() {
  return (
    <>
      <Head>
        <title>Online DAW</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/logo-pattern.svg" />
      </Head>
      <Window>
        {/* <Header /> */}
        <Container>
          <Links>
            <Link href={`/dashboard`}>
              <LinkText>dashboard</LinkText>
            </Link>
            <LinkText>
              <Link href={`/login`}>login</Link>
            </LinkText>
            <LinkText>
              <Link href={`/signup`}>signup</Link>
            </LinkText>
          </Links>
          <Titles>
            <TitleWrapper>
              <Image
                src={"/logo-pattern-orange.svg"}
                alt={"logo"}
                width={192 * 1.5}
                height={108 * 1.5}
              />
              <Title> Online DAW</Title>
            </TitleWrapper>
            <SubTitle>Make music together Online</SubTitle>
            <Description>
              Make some noise, explore a new sound, create a song or collaborate
              with others. Welcome to the collective of passionate music
              creators, whether you already are one or aspire to become one.
            </Description>
          </Titles>

          <DemoBlocks>
            <DemoBlock>
              <Image
                src={"/demo-audio-track.png"}
                alt={"demo-audio-track"}
                width={192 * 1.5}
                height={108 * 1.5}
              />
              <DemoContent>
                <DemoContentTitle>Audio Track</DemoContentTitle>
                <DemoContentDescription>
                  Audio Track is used for audio recording, audio editing
                </DemoContentDescription>
              </DemoContent>
            </DemoBlock>
            <DemoBlock>
              <Image
                src={"/demo-midi-track.png"}
                alt={"demo-midi-track"}
                width={192 * 1.5}
                height={108 * 1.5}
              />
              <DemoContent>
                <DemoContentTitle>Midi Track</DemoContentTitle>
                <DemoContentDescription>
                  Midi Track contain data about notes and playback sound
                </DemoContentDescription>
              </DemoContent>
            </DemoBlock>
            <DemoBlock>
              <Image
                src={"/demo-export.png"}
                alt={"demo-export"}
                width={192 * 1.5}
                height={108 * 1.5}
              />
              <DemoContent>
                <DemoContentTitle>Export MP3</DemoContentTitle>
                <DemoContentDescription>
                  Export an MP3 directly from online-DAW
                </DemoContentDescription>
              </DemoContent>
            </DemoBlock>
          </DemoBlocks>
        </Container>
        <Footer />
      </Window>
    </>
  );
}
