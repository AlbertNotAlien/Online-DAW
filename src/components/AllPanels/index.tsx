import Avatar from "boring-avatars";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import ReactTooltip from "react-tooltip";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import styled from "styled-components";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { db, storage } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  isRecordingState,
  isMetronomeState,
  playerStatusState,
  isLoadingState,
  TrackData,
  ProjectData,
  inputProgressState,
} from "../../../src/store/atoms";

import useRecorder from "../../utils/useRecorder";
import Modal from "../Modal";
import Tracks from "../Tracks";
import PianoRoll from "../PianoRoll";
// import Library from "../Library";
import Export from "../Export";
import Loader from "../Loader";
import { useOnClickOutside } from "../../utils/useOnClickOutside";
const { v4: uuidv4 } = require("uuid");

const Container = styled.div`
  width: calc(100vw);
  height: calc(100vh);
  background-color: hsl(0, 0%, 30%);
  padding: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  justify-content: space-between;
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

const HeadBarPanelParts = styled.div`
  height: 100%;
  width: 100%;
  column-gap: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeadBarPanelPart = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  column-gap: 10px;
`;

const HeadBarDivider = styled.div`
  height: 80%;
  border-left: 1px solid #494949;
`;

const Logo = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: calc(200px - 10px);
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
  background-color: #323232;
  border-radius: 10px;
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
  background-color: #323232;
  border-radius: 10px;
`;

const ExportControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  background-color: #323232;
  border-radius: 10px;
`;

const TempoInput = styled.input`
  width: 40px;
  text-align: center;
  border: none;
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
  justify-content: space-between;
  align-items: center;
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
  justify-content: center;
  height: 100%;
  width: 40px;
  &:hover {
    transform: scale(110%);
  }
  &:focus {
    outline: none;
  }
`;

const TracksPanelScroll = styled.div`
  overflow: auto;

  &::-webkit-scrollbar {
    width: 10px;
    height: 10px;
  }

  &::-webkit-scrollbar-button {
    display: none;
  }

  &::-webkit-scrollbar-track-piece {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 5px;
    background-color: #727272;
  }

  &::-webkit-scrollbar-track {
    box-shadow: transparent;
    background-color: transparent;
  }

  &::-webkit-scrollbar-corner {
    background: transparent;
  }
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
`;

const ProjectNameWrapper = styled.p`
  font-size: 14px;
  text-align: center;
  padding: 0px 10px;
`;

const AllPanels = ({ projectId }: { projectId: string }) => {
  const [projectData, setProjectData] = useRecoilState(projectDataState);
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const setBarWidth = useSetRecoilState(barWidthState);

  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const [progress, setProgress] = useRecoilState(progressState);
  const [inputProgress, setInputProgress] = useRecoilState(inputProgressState);
  const [tempo, setTempo] = useState<string>("");
  const isRecording = useRecoilValue(isRecordingState);

  const [recordFile, setRecordFile, , startRecording, stopRecording] =
    useRecorder();

  const [isMetronome, setIsMetronome] = useRecoilState(isMetronomeState);
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const docRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const newData = snapshot.data() as ProjectData;
      setProjectData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!projectId) return;

    const colRef = collection(db, "projects", projectId, "tracks");
    const q = query(colRef, orderBy("createdTime"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newData = [] as TrackData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TrackData;
        newData.push(docData);
      });
      setTracksData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, [projectId, setTracksData]);

  const handlePlay = () => {
    setPlayerStatus("playing");
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

    const dotIndex = filename.lastIndexOf(".");
    if (filename?.lastIndexOf(".") && dotIndex === -1) {
      return filename + "_" + fileDate;
    } else if (filename?.lastIndexOf(".") && dotIndex !== -1) {
      return (
        filename.substring(0, dotIndex) +
        "_" +
        fileDate +
        filename.substring(dotIndex)
      );
    } else {
      return filename + "_" + fileDate;
    }
  };

  const updateSelectedTrackIndex = async () => {
    const colRef = collection(db, "projects", projectId, "tracks");
    const querySnapshot = await getDocs(colRef);

    const newData = [] as TrackData[];
    querySnapshot.forEach((doc) => {
      const docData = doc.data() as TrackData;
      newData.push(docData);
    });

    if (selectedTrackIndex !== null) {
      const newSelectedTrackIndex = newData.findIndex(
        (track) => track.id === selectedTrackId
      );
      newSelectedTrackIndex === -1
        ? setSelectedTrackIndex(null)
        : setSelectedTrackIndex(newSelectedTrackIndex);
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
    volume: number,
    pan: number,
    selectedBy: string,
    createdTime: Date,
    trackId: string
  ) => {
    console.log("uploadFileInfo");
    try {
      const docRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        id: trackId,
        name: name,
        type: type,
        clips: [
          {
            clipName: clipName,
            startPoint: startPoint,
            url: url,
          },
        ],
        isMuted: isMuted,
        isSolo: isSolo,
        volume: volume,
        pan: pan,
        selectedBy: selectedBy,
        createdTime: createdTime,
      };
      recordFile && type === "record"
        ? await updateDoc(docRef, newData)
        : await setDoc(docRef, newData);
    } catch (err) {
      console.log(err);
    }
  };

  const handleUploadAudio = (
    file: Blob,
    type: string,
    startPoint: {
      bars: number;
      quarters: number;
      sixteenths: number;
    },
    trackId: string,
    trackName: string,
    fileName: string
  ) => {
    if (file === null || !tracksData) return;

    setIsLoading(true);

    const newStartPoint = {
      bars: startPoint.bars,
      quarters: startPoint.quarters,
      sixteenths: startPoint.sixteenths,
    };

    const audioRef = ref(storage, `projects/${projectId}/audios/${fileName}`);

    uploadBytes(audioRef, file)
      .then((snapshot) => {
        getDownloadURL(snapshot.ref).then(async (url) => {
          // const trackId = uuidv4().split("-")[0];
          await uploadFileInfo(
            trackName,
            type,
            fileName,
            newStartPoint,
            url,
            false,
            false,
            0,
            0,
            "",
            new Date(),
            trackId
          );
        });
        updateSelectedTrackIndex();
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        if (!recordFile) return;
        setIsLoading(false);
        setRecordFile(null);
      });
  };

  const handleTempoChange = async (newTempo: number) => {
    setBarWidth((120 / newTempo) * 10); // projectData.barWidthCoefficient

    try {
      const docRef = doc(db, "projects", projectId);
      const newData = {
        tempo: newTempo,
      };
      await updateDoc(docRef, newData);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    setBarWidth((120 / projectData.tempo) * 10);
    setTempo(projectData.tempo.toString());
  }, [projectData, setBarWidth]);

  const recordStartTimeRef = useRef({ bars: 0, quarters: 0, sixteenths: 0 });

  const newRecordTrackIdRef = useRef("");
  const newRecordTrackNameRef = useRef("");
  const newRecordFileNameRef = useRef("");

  const handleRecord = () => {
    if (!isRecording && typeof startRecording === "function") {
      newRecordTrackIdRef.current = uuidv4().split("-")[0];
      recordStartTimeRef.current = {
        bars: progress.bars,
        quarters: progress.quarters,
        sixteenths: progress.sixteenths,
      };

      newRecordTrackNameRef.current = `Record ${tracksData.length + 1}`;
      newRecordFileNameRef.current = appendToFilename("record");
      const newStartPoint = {
        bars: progress.bars,
        quarters: progress.quarters,
        sixteenths: progress.sixteenths,
      };
      const createdTime = new Date();

      uploadFileInfo(
        newRecordTrackNameRef.current,
        "record",
        newRecordFileNameRef.current,
        newStartPoint,
        "",
        false,
        false,
        0,
        0,
        "",
        createdTime,
        newRecordTrackIdRef.current
      );

      startRecording();
      setPlayerStatus("recording");
    } else if (isRecording && typeof stopRecording === "function") {
      setRecordFile(null);
      stopRecording();
      setPlayerStatus("paused");
    }
  };

  useEffect(() => {
    if (!recordFile) return;
    handleUploadAudio(
      recordFile,
      "record",
      recordStartTimeRef.current,
      newRecordTrackIdRef.current,
      newRecordTrackNameRef.current,
      newRecordFileNameRef.current
    );
  }, [recordFile]); // useCallback來最佳化效能

  const cleanupSelectedBy = async () => {
    if (!tracksData || selectedTrackId === null || selectedTrackIndex === null)
      return;
    setSelectedTrackId(null);
    setSelectedTrackIndex(null);

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
    } catch (err) {
      console.log(err);
    }
  };

  const tracksContainerRef = useRef(null);
  const pianoRollRef = useRef(null);

  const handleClickOutside = () => {
    if (selectedTrackId === null || selectedTrackIndex === null) return;
    cleanupSelectedBy();
  };
  useOnClickOutside(tracksContainerRef, pianoRollRef, handleClickOutside);

  return (
    <Container>
      <HeadBarPanel>
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
        <HeadBarPanelParts>
          <HeadBarPanelPart>
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
                  if (
                    tempo !== "" &&
                    Number(tempo) > 0 &&
                    Number(tempo) <= 240
                  ) {
                    handleTempoChange(Number(event.currentTarget.value));
                  }
                }}
              />
              <HeadBarDivider />
              <Button>
                <Image
                  src={
                    isMetronome
                      ? "/metronome-button-activated.svg"
                      : "/metronome-button.svg"
                  }
                  alt="metronome"
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
                  const handleProgressInput = () => {
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
                      setInputProgress((prev) => ({
                        ...prev,
                        bars: inputProgress.bars,
                      }));
                    }
                  };
                  handleProgressInput();
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
              <ReactTooltip
                id="progressInput"
                place="top"
                effect="solid"
                delayShow={1000}
              >
                Arrangement Position - quarters
              </ReactTooltip>
              <HeadBarDivider />
              <ProgressInput
                data-tip
                data-for="progressInput"
                data-delay-show="1000"
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
                    console.log(
                      "inputProgress.quarters",
                      inputProgress.quarters
                    );
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
              <HeadBarDivider />
              <ProgressInput
                value={`${Math.floor(progress.sixteenths + 1)}`}
                onChange={() => {}}
              />
            </ProgressInputs>
            <HeadBarDivider />

            <PlayerButtons>
              <Button onClick={handlePlay}>
                <Image
                  src={
                    playerStatus === "playing"
                      ? "/play-button-activated.svg"
                      : "/play-button.svg"
                  }
                  alt="play"
                  width={18}
                  height={18}
                />
              </Button>
              <HeadBarDivider />
              <Button onClick={handlePause}>
                <Image
                  src="/pause-button.svg"
                  alt="pause"
                  width={16}
                  height={16}
                />
              </Button>
              <HeadBarDivider />
              <Button onClick={handleRecord}>
                <Image
                  src={
                    playerStatus === "recording"
                      ? "/record-button-activated.svg"
                      : "/record-button.svg"
                  }
                  alt="record"
                  width={18}
                  height={18}
                />
              </Button>
            </PlayerButtons>
          </PlayerControls>
          <HeadBarPanelPart>
            <ExportControls>
              <ProjectNameWrapper>{projectData?.name}</ProjectNameWrapper>
              <HeadBarDivider />

              {isLoading && (
                <Modal setIsModalOpen={setIsModalOpen}>
                  <Loader />
                </Modal>
              )}
              <Export />
            </ExportControls>

            <Link href="/profile">
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
        </HeadBarPanelParts>
      </HeadBarPanel>
      <MainEditPanel
        isMidiTrack={
          selectedTrackIndex !== null &&
          tracksData?.[selectedTrackIndex].type === "midi"
        }
      >
        {/* <Library /> */}
        <TracksPanelScroll ref={tracksContainerRef}>
          <TracksPanel>
            <Tracks
              progress={progress}
              projectId={projectId}
              handleUploadAudio={handleUploadAudio}
              updateSelectedTrackIndex={updateSelectedTrackIndex}
              isModalOpen={isModalOpen}
              setIsModalOpen={setIsModalOpen}
              cleanupSelectedBy={cleanupSelectedBy}
              recordStartTimeRef={recordStartTimeRef}
              appendToFilename={appendToFilename}
            />
          </TracksPanel>
        </TracksPanelScroll>
      </MainEditPanel>
      <PianoRollPanel
        isMidiTrack={
          selectedTrackIndex !== null &&
          tracksData?.[selectedTrackIndex].type === "midi"
        }
        ref={pianoRollRef}
      >
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
      </PianoRollPanel>
    </Container>
  );
};

export default AllPanels;
