import { useRouter } from "next/router";
import { useState, useEffect, ReactNode, useCallback } from "react";
import styled from "styled-components";
const { v4: uuidv4 } = require("uuid");
const { CopyToClipboard } = require("react-copy-to-clipboard");

import { useAuth } from "../../context/AuthContext";
import { db, auth } from "../../config/firebase";
import {
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDoc,
  setDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import Avatar from "boring-avatars";
import Link from "next/link";
import { set } from "firebase/database";
import produce from "immer";

import Header from "../../components/Header";

interface ProjectInfo {
  id: string;
  name: string;
  tempo: number;
  ownerId: string;
  ownerName: string;
  createdTime: Timestamp;
}

const Container = styled.div`
  max-height: 80%;
  display: flex;
  padding-top: 30px;
  /* margin: 0px auto; */
`;

const SidebarWrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 20px;
  width: 200px;
  height: 100%;
  background-color: rebeccapurple;
  margin-top: 80px;
  padding-left: 20px;
`;

const SidebarOption = styled.div`
  cursor: pointer;
`;

const ProjectsWrapper = styled.div`
  /* max-width: 960px; */
  /* margin: 0px auto; */
  padding: 0px 20px;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 40px;
  /* margin-bottom: 30px; */
  height: 80px;
`;

const Projects = styled.div`
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  column-gap: 15px;
  row-gap: 15px;
  /* justify-content: space-between; */
`;

const Project = styled.div`
  width: calc((100% - 30px) / 3);
  height: 150px;
  &:hover {
    filter: brightness(110%);
  }
`;

const ProjectWrapper = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background-color: #6e6e6e;
  display: flex;
  flex-direction: column;
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
  /* height: 50%; */
  background-color: gray;
`;

const ProjectContent = styled.div`
  padding: 15px;
  height: 75px;
  /* height: 60px; */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const ProjectTitle = styled.div`
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

const ProjectModal = styled.div<ProjectModalProps>`
  display: ${(props) => (props.isProjectModalOpen ? "flex" : "none")};
  flex-direction: column;
  position: absolute;
  width: 100px;
  /* height: 100px; */
  background-color: gray;
  right: 0px;
  top: 110px;
  border-radius: 10px;
  overflow: hidden;
  z-index: 20;
  /* padding: 10px 10px; */
  /* row-gap: 10px; */
`;

const ProjectModalOption = styled.div`
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

const Dashboard = () => {
  const [userProjectList, setUserProjectList] = useState<ProjectInfo[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean[]>([]);
  const [copied, setCopied] = useState(false);

  const { user, logout } = useAuth();

  console.log("isProjectModalOpen", isProjectModalOpen);

  // const router = useRouter();
  // const { userId } = router.query;
  // console.log(userId);

  console.log(window.location.host);
  console.log(user);

  const onCopy = useCallback(() => {
    setCopied(true);
  }, []);

  const getProjectsData = async () => {
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setUserProjectList(docSnap.data().projects);
    } else {
      console.log("No such document!");
    }
  };

  useEffect(() => {
    getProjectsData();
  }, [user.uid]);

  useEffect(() => {
    if (userProjectList) {
      setIsProjectModalOpen(userProjectList.map((project) => false));
    }
  }, [userProjectList]);

  const addMidiTrack = async (projectId: string) => {
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
        name: "Midi",
        type: "midi",
      };
      await setDoc(docRef, newData);
    } catch (err) {
      console.log(err);
    }
  };

  const addNewProject = async () => {
    let projectId = "";
    const createdTime = new Date();

    // add new project
    try {
      const docRef = doc(collection(db, "projects"));
      console.log("docRef.id", docRef.id);
      const newData = {
        id: docRef.id,
        name: "project",
        tempo: 60,
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

    // add subcollection "tracks"
    addMidiTrack(projectId);

    // add project-info to users collection
    try {
      const docRef = doc(db, "users", user.uid);
      const newData = {
        id: projectId,
        name: "project",
        tempo: 60,
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

  // const addMidiTrack = async () => {
  //   try {
  //     const trackRef = doc(
  //       collection(db, "projects", projectData.id, "tracks")
  //     );
  //     const newData = {
  //       id: trackRef.id,
  //       name: "Midi",
  //       type: "midi",
  //       isMuted: false,
  //       isSolo: false,
  //       clips: [
  //         {
  //           clipName: "",
  //           notes: [],
  //           startPoint: {
  //             bars: 0,
  //             quarters: 0,
  //             sixteenths: 0,
  //           },
  //         },
  //       ],
  //       selectedBy: "",
  //     };
  //     await setDoc(trackRef, newData);
  //     console.log("info uploaded");
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

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
    return `${months[dateArray[1]]} ${dateArray[2]}, ${dateArray[0]}`;
  };

  const handleProjectMenuIcon = (projectIndex: number) => {
    setIsProjectModalOpen(
      produce(isProjectModalOpen, (draft) => {
        draft[projectIndex] = !draft[projectIndex];
      })
    );
  };

  return (
    <>
      <Header />
      <Container>
        <SidebarWrapper>
          <div>Sort By</div>
          <div>Recent</div>
          <div>Project Name</div>
          <div>Owner</div>
        </SidebarWrapper>
        <ProjectsWrapper>
          <Title>Recent</Title>
          <Projects>
            <NewProject onClick={addNewProject}>+</NewProject>
            {userProjectList?.length > 0 &&
              userProjectList.map((project, projectIndex) => (
                <Project key={project.id}>
                  <ProjectModal
                    isProjectModalOpen={isProjectModalOpen[projectIndex]}
                    onClick={() => {
                      handleProjectMenuIcon(projectIndex);
                    }}
                  >
                    <ProjectModalOption>rename</ProjectModalOption>
                    <CopyToClipboard
                      onCopy={onCopy}
                      text={`${window.location.host}/project/${project.id}`}
                    >
                      <ProjectModalOption>copy link</ProjectModalOption>
                    </CopyToClipboard>
                    <ProjectModalOption
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
                    </ProjectModalOption>
                  </ProjectModal>
                  <ProjectWrapper>
                    <Link href={`/project/${project.id}`}>
                      <ProjectBanner />
                    </Link>
                    <ProjectContent>
                      <ProjectTitle>
                        <Link href={`/project/${project.id}`}>
                          <ProjectName>{project.name}</ProjectName>
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
                      {/* <button
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
                      </button> */}
                    </ProjectContent>
                  </ProjectWrapper>
                </Project>
              ))}
          </Projects>
        </ProjectsWrapper>
      </Container>
    </>
  );
};

export default Dashboard;
