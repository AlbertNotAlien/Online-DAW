import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilState, useSetRecoilState } from "recoil";
import produce from "immer";
const { v4: uuidv4 } = require("uuid");

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  isPlayingState,
  isPausedState,
  isRecordingState,
  isMetronomeState,
  playerStatusState,
  isLoadingState,
  TrackData,
  ProjectData,
  inputProgressState,
} from "../../context/atoms";
import WaveSurfer from "../Tracks/WaveSurfer";

import useRecorder from "../Record/useRecorder";
import Modal from "../Modal";
import Tracks from "../Tracks";
import PianoRoll from "../PianoRoll";
import Library from "../Library";
import Export from "../Export";
import Link from "next/link";
import Avatar from "boring-avatars";
import Loader from "../Loader";
import { useOnClickOutside } from "../../utils/useOnClickOutside";

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: hsl(0, 0%, 30%);
  padding: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`;

const HeadBarPanel = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  background-color: gray;
  padding: 10px 20px;
  align-items: center;
  border-radius: 10px;
  height: 50px;
  position: relative;
`;

const HeadBarPanelPart = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
`;

const Logo = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: calc(200px - 20px + 10px);
`;

const Profile = styled.div`
  display: flex;
  align-items: center;
`;

interface MainEditPanelProps {
  isMidiTrack: boolean;
}

const PlayerControls = styled.div`
  height: 30px;
  display: flex;
  align-items: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

const PlayerButtons = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const TempoControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const ExportControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const TempoInput = styled.input`
  width: 50px;
  text-align: center;
  border: none;
  border-radius: 3px;
  height: 100%;
  color: white;
  background-color: #323232;
  border-radius: 10px;
  &:focus {
    outline: none;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const ProgressInputs = styled.div`
  display: flex;
  /* column-gap: 10px; */
  height: 100%;
  background-color: #323232;
  border-radius: 10px;
  width: 100px;
  justify-content: center;
`;

const ProgressInput = styled.input`
  width: 30px;
  color: white;
  margin: 4px 0px;
  border-radius: 5px;
  border: none;
  background: #323232;
  text-align: center;
  &:focus {
    outline: none;
  }
  &:hover {
    filter: brightness(200%);
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const MainEditPanel = styled.div<MainEditPanelProps>`
  display: flex;
  column-gap: 10px;
  ${(props) =>
    props.isMidiTrack
      ? `height: calc(100vh - 50px - 200px - 10 * 4px);`
      : `height: calc(100vh - 50px - 30px - 10 * 4px);`};
`;

interface PianoRollPanelProps {
  isMidiTrack: boolean;
}

const PianoRollPanel = styled.div<PianoRollPanelProps>`
  display: flex;
  padding: 10px;
  background-color: gray;
  border-radius: 10px;
  height: ${(props) => (props.isMidiTrack ? "200px" : "30px")};
  width: 100%;
`;

const Button = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  height: 100%;
  &:hover {
    transform: scale(110%);
  }
  &:focus {
    outline: none;
  }
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  overflow: auto;
`;

const AllPanels = (props: any) => {
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const projectId = props.projectId;
  const [barWidth, setBarWidth] = useRecoilState(barWidthState);

  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isPaused, setIsPaused] = useRecoilState(isPausedState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const [audioList, setAudioList] = useState<string[]>([]);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const [progress, setProgress] = useRecoilState(progressState);
  const [inputProgress, setInputProgress] = useRecoilState(inputProgressState);
  const [tempo, setTempo] = useState<string>("");

  const [recordFile, recordURL, isRecording, startRecording, stopRecording] =
    useRecorder();

  const [isMetronome, setIsMetronome] = useRecoilState(isMetronomeState);
  const { user, logout } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  // console.log("projectId", projectId);
  useEffect(() => {
    if (projectId) {
      const docRef = doc(db, "projects", projectId);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const newData = snapshot.data() as ProjectData;
        console.log(newData);
        setProjectData(newData);
      });

      return () => {
        unsubscribe();
      };
    }
  }, []);

  useEffect(() => {
    const colRef = collection(db, "projects", projectId, "tracks");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const newData = [] as TrackData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TrackData;
        newData.push(docData);
      });
      setTracksData(newData);
    });

    console.log("unsubscribe");

    return () => {
      unsubscribe();
    };
  }, [projectId, setTracksData]);

  const handlePlay = () => {
    setPlayerStatus("playing");
    console.log("handlePlay");
  };

  const handlePause = () => {
    if (playerStatus === "recording") {
      handleRecord();
    } else if (playerStatus === "paused") {
      setProgress({
        bars: 0,
        quarters: 0,
        sixteenths: 0,
      });
      setInputProgress({
        bars: 0,
        quarters: 0,
        sixteenths: 0,
      });
    }
    setPlayerStatus("paused");
  };

  const appendToFilename = (filename: string) => {
    const date = new Date();
    const fileDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;

    if (filename?.lastIndexOf(".")) {
      const dotIndex = filename.lastIndexOf(".");
      if (dotIndex === -1) {
        return filename + "_" + fileDate;
      } else {
        return (
          filename.substring(0, dotIndex) +
          "_" +
          fileDate +
          filename.substring(dotIndex)
        );
      }
    } else {
      return filename + "_" + fileDate;
    }
  };

  const uploadFileInfo = async (
    name: string,
    type: string,
    clipName: string,
    startPoint: { bars: number; quarters: number; sixteenths: number },
    url: string,
    isMuted: boolean,
    isSolo: boolean,
    selectedBy: string
  ) => {
    try {
      const trackId = uuidv4().split("-")[0];
      const docRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        id: trackId,
        name: name,
        type: type,
        isMuted: isMuted,
        isSolo: isSolo,
        clips: [
          {
            clipName: clipName,
            startPoint: startPoint,
            url: url,
          },
        ],
        selectedBy: selectedBy,
      };
      await setDoc(docRef, newData);
      console.log("info uploaded");
    } catch (err) {
      console.log(err);
    }
  };

  const updateSelectedTrackIndex = async () => {
    const colRef = collection(db, "projects", projectId, "tracks");
    const querySnapshot = await getDocs(colRef);

    const newData = [] as TrackData[];
    querySnapshot.forEach((doc) => {
      console.log(doc.id, doc.data());
      const docData = doc.data() as TrackData;
      newData.push(docData);
    });
    console.log("newData", newData);
    setTracksData(newData);

    if (selectedTrackIndex !== null) {
      const newSelectedTrackIndex = newData.findIndex(
        (track) => track.id === selectedTrackId
      );
      newSelectedTrackIndex === -1
        ? setSelectedTrackIndex(null)
        : setSelectedTrackIndex(newSelectedTrackIndex);
    }
  };

  const handleUploadAudio = (file: any) => {
    setIsLoading(true);

    if (file && tracksData) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(file.name || "record");
      const newStartPoint = { bars: 0, quarters: 0, sixteenths: 0 };

      const audioRef = ref(
        storage,
        `projects/${projectId}/audios/${newFileName}`
      );

      uploadBytes(audioRef, file)
        .then((snapshot) => {
          getDownloadURL(snapshot.ref).then(async (url) => {
            setAudioList((prev) => [...prev, url]);
            console.log("url", url);

            await uploadFileInfo(
              newTrackName,
              "audio",
              newFileName,
              newStartPoint,
              url,
              false,
              false,
              ""
            );
            console.log("uploadBytes");
          });

          updateSelectedTrackIndex();
        })

        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleTempoChange = async (newTempo: number) => {
    setBarWidth((120 / newTempo) * 10); // projectData.barWidthCoefficient

    try {
      const docRef = doc(db, "projects", projectId);
      const newData = {
        tempo: newTempo,
      };
      await updateDoc(docRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setBarWidth((120 / projectData.tempo) * 10);
    setTempo(projectData.tempo.toString());
    console.log("useEffect");
  }, [projectData]);

  useEffect(() => {
    if (recordFile) {
      console.log(recordFile);
      handleUploadAudio(recordFile);
    }
  }, [recordFile]);

  const handleRecord = () => {
    console.log("isRecording", isRecording);
    if (!isRecording && typeof startRecording === "function") {
      startRecording();
      setPlayerStatus("recording");
    } else if (isRecording && typeof stopRecording === "function") {
      stopRecording();
      setPlayerStatus("paused");
    }
  };

  const cleanupSelectedBy = async () => {
    if (tracksData && selectedTrackId !== null && selectedTrackIndex !== null) {
      const prevSelectedTrackIndex = selectedTrackIndex;
      // setTracksData(
      //   produce(tracksData, (draft) => {
      //     draft[prevSelectedTrackIndex].selectedBy = "";
      //   })
      // );
      setSelectedTrackId(null);
      setSelectedTrackIndex(null);
      console.log("cleanupSelectedBy");

      try {
        const docRef = doc(
          db,
          "projects",
          projectId,
          "tracks",
          selectedTrackId // previous selectedTrackId
        );
        const newData = {
          selectedBy: "",
        };
        await updateDoc(docRef, newData);
        console.log("upload cleanupSelectedBy");
      } catch (err) {
        console.log(err);
      }
    }
  };

  const tracksContainerRef = useRef(null);
  const pianoRollRef = useRef(null);

  const handleClickOutside = () => {
    console.log("handleClickOutside");
    if (selectedTrackId !== null && selectedTrackIndex !== null) {
      cleanupSelectedBy();
    }
  };
  useOnClickOutside(tracksContainerRef, pianoRollRef, handleClickOutside);

  return (
    <Container>
      <HeadBarPanel>
        <HeadBarPanelPart>
          <Link href={"/"}>
            <Logo>
              <Image
                src="/logo-combine.svg"
                alt="logo"
                width={84.084 * 1.5}
                height={22.555 * 1.5}
              />
            </Logo>
          </Link>
          <p>{projectData.name}</p>
          <TempoControls>
            <TempoInput
              type="text"
              value={tempo}
              required
              onChange={(event) => {
                const regex = /^[0-9\s]*$/;
                if (regex.test(event.currentTarget.value)) {
                  setTempo(event.currentTarget.value);
                }
              }}
              onKeyPress={(event) => {
                if (
                  event.key === "Enter" &&
                  tempo !== "" &&
                  Number(tempo) > 0 &&
                  Number(tempo) <= 240
                ) {
                  handleTempoChange(Number(event.currentTarget.value));
                  event.currentTarget.blur();
                }
              }}
              onBlur={(event) => {
                if (tempo !== "" && Number(tempo) > 0 && Number(tempo) <= 240) {
                  handleTempoChange(Number(event.currentTarget.value));
                }
              }}
            />
            <Button>
              <Image
                src={
                  isMetronome
                    ? "/metronome-button-activated.svg"
                    : "/metronome-button.svg"
                }
                alt={""}
                width={20}
                height={20}
                onClick={() => {
                  setIsMetronome(!isMetronome);
                }}
              />
            </Button>
          </TempoControls>
        </HeadBarPanelPart>
        <PlayerControls>
          <ProgressInputs>
            <ProgressInput
              value={`${inputProgress.bars + 1}`}
              onChange={(event) => {
                const regex = /^[0-9\s]*$/;
                if (
                  regex.test(event.currentTarget.value) &&
                  event.currentTarget.value !== ""
                ) {
                  setInputProgress((prev) => ({
                    ...prev,
                    bars: Number(event.currentTarget.value) - 1,
                  }));
                } else if (event.currentTarget.value === "") {
                  console.log("inputProgress.bars", inputProgress.bars);
                  setInputProgress((prev) => ({
                    ...prev,
                    bars: inputProgress.bars,
                  }));
                }
              }}
              onKeyPress={(event) => {
                if (
                  event.key === "Enter" &&
                  inputProgress.bars.toString() !== "" &&
                  inputProgress.bars >= 0 &&
                  inputProgress.bars <= 240
                ) {
                  setProgress((prev) => ({
                    ...prev,
                    bars: Number(event.currentTarget.value) - 1,
                  }));
                  event.currentTarget.blur();
                }
              }}
              onBlur={(event) => {
                if (
                  inputProgress.bars.toString() !== "" &&
                  inputProgress.bars > 0 &&
                  inputProgress.bars <= 240
                ) {
                  setProgress((prev) => ({
                    ...prev,
                    bars: Number(event.currentTarget.value) - 1,
                  }));
                }
              }}
            />
            <ProgressInput
              value={`${inputProgress.quarters + 1}`}
              onChange={(event) => {
                const regex = /^[0-9\s]*$/;
                if (
                  regex.test(event.currentTarget.value) &&
                  event.currentTarget.value !== ""
                ) {
                  setInputProgress((prev) => ({
                    ...prev,
                    quarters: Number(event.currentTarget.value) - 1,
                  }));
                } else if (event.currentTarget.value === "") {
                  console.log("inputProgress.quarters", inputProgress.quarters);
                  setInputProgress((prev) => ({
                    ...prev,
                    quarters: inputProgress.quarters,
                  }));
                }
              }}
              onKeyPress={(event) => {
                if (
                  event.key === "Enter" &&
                  inputProgress.quarters.toString() !== "" &&
                  inputProgress.quarters >= 0 &&
                  inputProgress.quarters <= 110
                ) {
                  setProgress((prev) => ({
                    ...prev,
                    quarters: Number(event.currentTarget.value) - 1,
                  }));
                  event.currentTarget.blur();
                }
              }}
              onBlur={(event) => {
                if (
                  inputProgress.quarters.toString() !== "" &&
                  inputProgress.quarters > 0 &&
                  inputProgress.quarters <= 240
                ) {
                  setProgress((prev) => ({
                    ...prev,
                    quarters: Number(event.currentTarget.value) - 1,
                  }));
                }
              }}
            />
            <ProgressInput
              value={`${Math.floor(progress.sixteenths + 1)}`}
              onChange={() => {}}
            />
          </ProgressInputs>
          <PlayerButtons>
            <Button onClick={handlePlay}>
              <Image
                src={
                  playerStatus === "playing"
                    ? "/play-button-activated.svg"
                    : "/play-button.svg"
                }
                alt={""}
                width={20}
                height={20}
              />
            </Button>
            <Button onClick={handlePause}>
              <Image src="/pause-button.svg" alt={""} width={20} height={20} />
            </Button>
            {/* <Record
              handlePlay={handlePlay}
              handlePause={handlePause}
              handleUploadAudio={handleUploadAudio}
            /> */}
            <Button onClick={handleRecord}>
              <Image
                src={
                  playerStatus === "recording"
                    ? "/record-button-activated.svg"
                    : "/record-button.svg"
                }
                alt={""}
                width={20}
                height={20}
              />
            </Button>
          </PlayerButtons>
        </PlayerControls>
        <HeadBarPanelPart>
          <ExportControls>
            {isLoading && (
              <Modal setIsModalOpen={setIsModalOpen}>
                <Loader />
              </Modal>
            )}
            {/* <Button> */}
            <Export />
            {/* </Button> */}
          </ExportControls>

          <Link href={"/profile"}>
            <Profile>
              {user ? (
                <Avatar
                  size={30}
                  name="Maria Mitchell"
                  variant="beam"
                  colors={[
                    "#92A1C6",
                    "#146A7C",
                    "#F0AB3D",
                    "#C271B4",
                    "#C20D90",
                  ]}
                />
              ) : (
                <Image
                  src="/profile.svg"
                  alt="profile"
                  width={30}
                  height={30}
                />
              )}
            </Profile>
          </Link>
        </HeadBarPanelPart>
      </HeadBarPanel>
      <MainEditPanel
        isMidiTrack={
          selectedTrackIndex !== null &&
          tracksData?.[selectedTrackIndex].type === "midi"
        }
      >
        <Library />
        <TracksPanel>
          <div ref={tracksContainerRef}>
            <Tracks
              progress={progress}
              projectId={projectId}
              handleUploadAudio={handleUploadAudio}
              updateSelectedTrackIndex={updateSelectedTrackIndex}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              cleanupSelectedBy={cleanupSelectedBy}
            />
          </div>
        </TracksPanel>
      </MainEditPanel>
      <PianoRollPanel
        isMidiTrack={
          selectedTrackIndex !== null &&
          tracksData?.[selectedTrackIndex].type === "midi"
        }
      >
        <div ref={pianoRollRef}>
          {tracksData &&
            selectedTrackIndex !== null &&
            tracksData[selectedTrackIndex].type === "midi" && (
              <PianoRoll
                projectId={projectId}
                projectData={projectData}
                tracksData={tracksData}
                selectedTrackId={selectedTrackId}
                selectedTrackIndex={selectedTrackIndex}
              />
            )}
        </div>
      </PianoRollPanel>
    </Container>
  );
};

export default AllPanels;
