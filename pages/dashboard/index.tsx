import { useAuth } from "../../src/context/AuthContext";
import { db } from "../../src/config/firebase";
import Header from "../../src/components/Header";
import Footer from "../../src/components/Footer";
import Modal from "../../src/components/Modal";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import Link from "next/link";
import { produce } from "immer";

import Head from "next/head";
import styled from "styled-components";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
const { CopyToClipboard } = require("react-copy-to-clipboard");
const { v4: uuidv4 } = require("uuid");

interface ProjectInfo {
  id: string;
  name: string;
  tempo: number;
  ownerId: string;
  ownerName: string;
  createdTime: Timestamp;
}

const Window = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Container = styled.div`
  min-height: 80%;
  display: flex;
  padding-top: 30px;
`;

const SidebarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 25px;
  width: 200px;
  height: 100%;
  margin-top: 80px;
  padding-left: 20px;
`;

const SidebarTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const SidebarOption = styled.div`
  cursor: pointer;
`;

const ProjectsWrapper = styled.div`
  width: 100%;
  padding: 0px 20px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 40px;
  font-weight: bold;
  height: 80px;
`;

const Projects = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  column-gap: 15px;
  row-gap: 15px;
`;

const Project = styled.div`
  width: calc((100% - 30px) / 3);
  height: 150px;
  position: relative;
`;

const ProjectWrapper = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background-color: #6e6e6e;
  display: flex;
  flex-direction: column;
  position: relative;

  &:hover {
    filter: brightness(110%);
  }
`;

const NewProject = styled.div`
  width: calc((100% - 30px) / 3);
  height: 150px;
  border-radius: 10px;
  overflow: hidden;
  background-color: #6e6e6e;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 36px;
  cursor: pointer;
  &:hover {
    filter: brightness(110%);
  }
`;

const ProjectBanner = styled.div`
  width: 100%;
  height: 75px;
  background-color: gray;
  position: relative;
`;

const ProjectContent = styled.div`
  padding: 15px;
  height: 75px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProjectTitle = styled.div`
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProjectName = styled.p`
  font-size: 18px;
  line-height: 18px;
`;

const ProjectMenuIcon = styled.button`
  font-size: 12px;
  line-height: 18px;
  background-color: #6e6e6e;
  border: none;
  cursor: default;
  /* z-index: 1; */
  &:hover {
    filter: brightness(110%);
  }
`;

interface ProjectModalProps {
  isProjectModalOpen: boolean;
}

const ProjectOptions = styled.div<ProjectModalProps>`
  display: ${(props) => (props.isProjectModalOpen ? "flex" : "none")};
  flex-direction: column;
  width: 100px;
  background-color: gray;
  right: 0px;
  top: 110px;
  border-radius: 10px;
  overflow: hidden;
  position: absolute;
  z-index: 2;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
`;

const ProjectOption = styled.div`
  cursor: pointer;
  background-color: gray;
  width: 100%;
  height: 100%;
  padding: 10px 10px;
  &:hover {
    filter: brightness(110%);
  }
`;

const ProjectInfos = styled.p`
  font-size: 12px;
`;

const ProjectModalWrapper = styled.div`
  width: 300px;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  row-gap: 10px;
`;

const ProjectModalTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const ProjectModalInput = styled.input`
  width: 100%;
  height: 30px;
  padding-left: 10px;
  border-radius: 10px;
  border: none;
  &:focus {
    outline: none;
  }
  color: white;
  background-color: #323232;
`;

const ProjectModalButtons = styled.div`
  height: 30px;
  display: flex;
  column-gap: 10px;
`;

const ProjectModalButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50%;
  border: none;
  cursor: pointer;
  background-color: #6e6e6e;
  border-radius: 10px;
  &:hover {
    filter: brightness(110%);
  }
`;

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { user, isLoadingLogin } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!user && !isLoadingLogin) {
      router.push("/login");
    }
  }, [isLoadingLogin, router, user]);
  return !user ? null : children;
};

const Dashboard = () => {
  const [userProjectList, setUserProjectList] = useState<ProjectInfo[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean[]>([]);
  // const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { user } = useAuth();

  const convertTimeStamp = (createdTime: Timestamp) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dateArray = createdTime
      ?.toDate()
      .toLocaleString()
      .substring(0, 10)
      .split("/")
      .map((date) => Number(date));
    return `${months[dateArray[1] - 1]} ${dateArray[2]}, ${dateArray[0]}`;
  };

  // const onCopy = useCallback(() => {
  //   setCopied(true);
  // }, []);

  const convertTimeStampToNumber = (timestamp: Timestamp) => {
    const timeArray = timestamp
      ?.toDate()
      .toLocaleString()
      .substring(0, 10)
      .split("/");
    return Number(`${timeArray[0]}${timeArray[1]}${timeArray[2]}`);
  };

  const getProjectsData = async () => {
    if (!user || !user.uid) return;
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const projects = docSnap.data().projects as ProjectInfo[];

      const newProjects = produce(projects, (draft) => {
        draft.sort(function (projectA: ProjectInfo, projectB: ProjectInfo) {
          return (
            convertTimeStampToNumber(projectA.createdTime) -
            convertTimeStampToNumber(projectB.createdTime)
          );
        });
      });
      setUserProjectList(newProjects);
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    getProjectsData();
  }, [user?.uid]);

  useEffect(() => {
    if (userProjectList) {
      setIsProjectModalOpen(userProjectList.map(() => false));
    }
  }, [userProjectList]);

  const addDefaultMidiTrack = async (projectId: string) => {
    try {
      const trackId = uuidv4().split("-")[0];
      const docRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        clips: [
          {
            notes: [],
            startPoint: {
              bars: 0,
              quarters: 0,
              sixteenths: 0,
            },
            clipName: "",
          },
        ],
        id: trackId,
        isMuted: false,
        isSolo: false,
        selectedBy: "",
        volume: 0,
        pan: 0,
        name: "Midi",
        type: "midi",
        createdTime: new Date(),
      };
      await setDoc(docRef, newData);
    } catch (err) {
      console.log(err);
    }
  };

  const addNewProject = async (projectName: string, projectBpm: number) => {
    if (!user) return;
    let projectId = "";
    const createdTime = new Date();

    // add new project
    try {
      const docRef = doc(collection(db, "projects"));
      console.log("docRef.id", docRef.id);
      const newData = {
        id: docRef.id,
        name: projectName,
        tempo: projectBpm,
        ownerId: user.uid,
        ownerName: user.displayName,
        createdTime: createdTime,
      };
      await setDoc(docRef, newData);
      console.log("info uploaded");

      projectId = docRef.id;
    } catch (err) {
      console.log(err);
    }

    // add subCollection "tracks"
    addDefaultMidiTrack(projectId);

    // add project-info to users collection
    try {
      const docRef = doc(db, "users", user.uid);
      const newData = {
        id: projectId,
        name: projectName,
        tempo: projectBpm,
        ownerId: user.uid,
        ownerName: user.displayName,
        createdTime: createdTime,
      };
      await updateDoc(docRef, { projects: arrayUnion(newData) });
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }

    getProjectsData();
  };

  const removeUserProject = async (
    projectId: string,
    projectName: string,
    projectTempo: number,
    ownerId: string,
    ownerName: string,
    createdTime: Timestamp
  ) => {
    if (!user) return;

    try {
      const docRef = doc(db, "users", user.uid);
      const newData = {
        id: projectId,
        name: projectName,
        tempo: projectTempo,
        ownerId: ownerId,
        ownerName: ownerName,
        createdTime: createdTime,
      };
      await updateDoc(docRef, { projects: arrayRemove(newData) });
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }

    await deleteDoc(doc(db, "projects", projectId));

    getProjectsData();
  };

  const handleProjectMenuIcon = (projectIndex: number) => {
    setIsProjectModalOpen(
      produce(isProjectModalOpen, (draft) => {
        draft[projectIndex] = !draft[projectIndex];
      })
    );
  };

  const newProjectNameRef = useRef<HTMLInputElement | null>(null);
  const newProjectBpmRef = useRef<HTMLInputElement | null>(null);

  const handleProjectRename = (newProjectName: string) => {
    console.log("newProjectName", newProjectName);
  };

  return (
    <Window>
      <Head>
        <title>{`${user?.displayName} - Dashboard | Online DAW`}</title>
        <meta name="description" content="Online DAW" />
        <link rel="icon" href="/logo-pattern.svg" />
      </Head>
      <Header />
      <Container>
        {isModalOpen && (
          <Modal setIsModalOpen={setIsModalOpen}>
            <ProjectModalWrapper>
              <ProjectModalTitle>New Project</ProjectModalTitle>
              <ProjectModalInput
                type="text"
                name="newProjectName"
                placeholder="project name"
                maxLength={20}
                ref={newProjectNameRef}
              ></ProjectModalInput>
              <ProjectModalInput
                type="text"
                name="bpm"
                placeholder="project bpm"
                maxLength={3}
                ref={newProjectBpmRef}
              ></ProjectModalInput>
              <ProjectModalButtons>
                <ProjectModalButton
                  onClick={() => {
                    const regex = /^[0-9\s]*$/;
                    if (
                      newProjectNameRef.current &&
                      newProjectBpmRef.current &&
                      newProjectNameRef.current.value.length > 0 &&
                      newProjectBpmRef.current.value.length > 0 &&
                      regex.test(newProjectBpmRef.current.value)
                    ) {
                      addNewProject(
                        newProjectNameRef.current.value,
                        Number(newProjectBpmRef.current.value)
                      );
                      setIsModalOpen(false);
                    }
                  }}
                >
                  confirm
                </ProjectModalButton>
                <ProjectModalButton
                  onClick={() => {
                    if (newProjectNameRef.current) {
                      newProjectNameRef.current = null;
                      setIsModalOpen(false);
                    }
                  }}
                >
                  cancel
                </ProjectModalButton>
              </ProjectModalButtons>
            </ProjectModalWrapper>
          </Modal>
        )}
        <SidebarWrapper>
          <SidebarTitle>Sort By</SidebarTitle>
          <SidebarOption>Recent</SidebarOption>
          <SidebarOption>Project Name</SidebarOption>
          <SidebarOption>Owner</SidebarOption>
        </SidebarWrapper>
        <ProjectsWrapper>
          <Title>Recent</Title>
          <Projects>
            <NewProject
              onClick={() => {
                setIsModalOpen(true);
              }}
            >
              +
            </NewProject>
            {userProjectList?.length > 0 &&
              userProjectList.map((project, projectIndex) => (
                <Project key={project.id}>
                  <ProjectOptions
                    isProjectModalOpen={isProjectModalOpen[projectIndex]}
                    onClick={() => {
                      handleProjectMenuIcon(projectIndex);
                    }}
                  >
                    <ProjectOption
                      onClick={() => {
                        handleProjectRename("123");
                      }}
                    >
                      rename
                    </ProjectOption>
                    <CopyToClipboard
                      // onCopy={onCopy}
                      text={`${window.location.protocol}//${window.location.host}/project/${project.id}`}
                    >
                      <ProjectOption>copy link</ProjectOption>
                    </CopyToClipboard>
                    <ProjectOption
                      onClick={() => {
                        removeUserProject(
                          project.id,
                          project.name,
                          project.tempo,
                          project.ownerId,
                          project.ownerName,
                          project.createdTime
                        );
                      }}
                    >
                      delete
                    </ProjectOption>
                  </ProjectOptions>
                  <ProjectWrapper>
                    <Link href={`/project/${project.id}`}>
                      <ProjectBanner />
                    </Link>
                    <ProjectContent>
                      <ProjectTitle>
                        <Link href={`/project/${project.id}`}>
                          <ProjectName>{project?.name}</ProjectName>
                        </Link>
                        <ProjectMenuIcon
                          onClick={() => {
                            handleProjectMenuIcon(projectIndex);
                          }}
                        >
                          ⋯
                        </ProjectMenuIcon>
                      </ProjectTitle>
                      <ProjectInfos>{`by ${project.ownerName} / bpm ${
                        project.tempo
                      } / ${convertTimeStamp(
                        project.createdTime
                      )}`}</ProjectInfos>
                    </ProjectContent>
                  </ProjectWrapper>
                </Project>
              ))}
          </Projects>
        </ProjectsWrapper>
      </Container>
      <Footer />
    </Window>
  );
};

const PrivateDashboard = () => {
  return (
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  );
};

export default PrivateDashboard;
