import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled, { keyframes } from "styled-components";
import { useRecoilState, useSetRecoilState } from "recoil";
import produce from "immer";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
} from "../../context/atoms";
// import TrackBars from "../Tracks/TrackBars/TrackNotes";
import WaveSurfer from "../Tracks/WaveSurfer";

import useRecorder from "../Record/useRecorder";
// import Record from "../Record";
// import Export from "../Export";
import Tracks from "../Tracks";
import PianoRoll from "../PianoRoll";
import Library from "../Library";
import Export from "../Export";
import Record from "../Record";

interface ProgresslineProps {
  progress: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  barWidth: number;
}

interface ProjectData {
  trackHeight: number;
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
}

interface RecordProps {
  isRecording: boolean;
}

// interface IsSoloButtonProps {
//   isSolo: string;
// }

const Container = styled.div`
  background-color: hsl(0, 0%, 30%);
  /* margin: 0; */
  padding: 10px;
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  height: 100vh;
`;

const LoaderKeyframes = keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
`;

const Loader = styled.div`
  border: 5px solid #f3f3f3;
  border-radius: 50%;
  border-top: 5px solid #3498db;
  width: 25px;
  height: 25px;
  animation-name: ${LoaderKeyframes};
  animation-duration: 1.5s;
  animation-iteration-count: infinite;
`;

const HeadBarPanel = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  background-color: gray;
  padding: 10px 10px;
  align-items: center;
  column-gap: 10px;
  border-radius: 10px;
  height: 50px;
`;

const MainEditPanel = styled.div`
  display: flex;
  column-gap: 10px;
  height: calc(100vh - 50px - 200px - 10 * 4px);
  /* flex-grow: 1; */
  /* flex-shrink: 0; */
`;

const PianoRollPanel = styled.div`
  display: flex;
  padding: 10px;
  background-color: gray;
  border-radius: 10px;
  height: 200px;
  /* overflow: auto; */
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

// const Record = styled(Button)``;

const PlayerControls = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
  left: 50%;
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
  margin: 4px 0px;
  border-radius: 5px;
  border: none;
  background: #323232;
  text-align: center;
  &:hover {
    filter: brightness(200%);
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  /* width: 100%; */
  /* flex-grow: 1; */
  overflow: hidden;
`;

const Timeline = () => {
  const [projectData, setProjectData] =
    useRecoilState<ProjectData>(projectDataState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const projectId = "5BbhQTKKkFcM9nCjMG3I";
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
  // console.log("progress", progress);
  // const [selectedTrack, setSelectedTrack] = useState(null);

  const [recordFile, recordURL, isRecording, startRecording, stopRecording] =
    useRecorder();

  const [isMetronome, setIsMetronome] = useRecoilState(isMetronomeState);

  useEffect(() => {
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
    const colRef = collection(db, "projects", projectId, "tracks");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const newData = [] as TrackData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TrackData;
        newData.push(docData);
      });
      setTracksdata(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setBarWidth((120 / projectData.tempo) * projectData.barWidthCoefficient);
  }, []);

  useEffect(() => {
    if (recordFile) {
      console.log(recordFile);
      handleUploadAudio(recordFile);
    }
  }, [recordFile]);

  // useEffect(() => {
  //   if (tracksData && selectedTrackIndex) {
  //     // const uploadTracksData = async () => {
  //     //   try {
  //     //     const trackRef = doc(
  //     //       db,
  //     //       "projects",
  //     //       projectId,
  //     //       "tracks",
  //     //       selectedTrackId
  //     //     );
  //     //     await updateDoc(trackRef, tracksData[selectedTrackIndex]);
  //     //     console.log("info updated");
  //     //   } catch (err) {
  //     //     console.log(err);
  //     //   }
  //     // };
  //     const uploadTracksData = () => {
  //       console.log("coool");
  //     };
  //     setTimeout(() => {
  //       uploadTracksData();
  //       console.log("upload selected trackData");
  //     }, 3000);
  //   }
  // }, [tracksData[selectedTrackIndex]]);

  // const convertMsToBeats = (sec: number) => {
  //   const bars = (sec * projectData.tempo) / 60 + 1;
  //   return bars;
  // };

  // const convertBeatsToMs = (bars: number) => {
  //   const millisecond = (bars * 60) / projectData.tempo;
  //   // console.log("convertBeatsToMs", millisecond);
  //   return millisecond;
  // };

  const handlePlay = () => {
    setPlayerStatus("playing");
    console.log("handlePlay");
  };

  const handlePause = () => {
    setPlayerStatus("paused");
    if (playerStatus === "paused") {
      setProgress({
        bars: 0,
        quarters: 0,
        sixteenths: 0,
      });
    }
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
    trackName: string,
    type: string,
    clipName: string,
    startPoint: { bars: number; quarters: number; sixteenths: number },
    url: string,
    isMuted: boolean,
    isSolo: boolean,
    selectedBy: string
  ) => {
    try {
      const trackRef = doc(collection(db, "projects", projectId, "tracks"));
      const newData = {
        id: trackRef.id,
        trackName: trackName,
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
      await setDoc(trackRef, newData);
      console.log("info uploaded");
    } catch (err) {
      console.log(err);
    }
  };

  const handleUploadAudio = (file: any) => {
    setIsLoading(true);
    console.log("handleUploadAudio");
    console.log("file", file);

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
          getDownloadURL(snapshot.ref).then((url) => {
            setAudioList((prev) => [...prev, url]);
            console.log("url", url);

            uploadFileInfo(
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
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const handleTempoChange = async (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    try {
      const trackRef = doc(db, "projects", projectId);
      const newData = {
        tempo: parseInt(event.currentTarget.value),
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  // useEffect(() => {
  //   if (tracksData && selectedTrackIndex) {
  //     const addKeyDown = (event: KeyboardEvent) => {
  //       if (event.key === "Backspace" || event.key === "Delete") {
  //         console.log(event.key);
  //         produce(tracksData, (draft) => {
  //           draft.filter(
  //             (track) => (draft = track !== draft[selectedTrackIndex])
  //           );
  //         });
  //       }
  //     };

  //     document.addEventListener("keydown", addKeyDown);

  //     return () => {
  //       document.removeEventListener("keydown", addKeyDown);
  //     };
  //   }
  // }, [selectedTrackIndex]);

  return (
    <Container>
      <HeadBarPanel>
        <TempoControls>
          <TempoInput
            type="number"
            // inputMode="numeric"
            value={projectData.tempo}
            min={1}
            required
            onChange={(event) => {
              // setProjectData((prev) => ({
              //   ...prev,
              //   tempo: parseInt(event.target.value),
              // }));
              handleTempoChange(event);
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
        <PlayerControls>
          <ProgressInputs>
            <ProgressInput value={`${progress.bars + 1}`} onChange={() => {}} />
            <ProgressInput
              value={`${progress.quarters + 1}`}
              onChange={() => {}}
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
            <Record
              handlePlay={handlePlay}
              handlePause={handlePause}
              handleUploadAudio={handleUploadAudio}
            />
          </PlayerButtons>
        </PlayerControls>

        <ExportControls>
          {isLoading && <Loader />}

          <Button>
            <Export />
          </Button>
        </ExportControls>
      </HeadBarPanel>
      <MainEditPanel>
        <Library />
        <TracksPanel>
          <Tracks
            // isPlaying={isPlaying}
            // projectData={projectData}
            // trackData={tracksData[index]}
            // barWidth={barWidth}
            progress={progress}
            // convertBeatsToMs={convertBeatsToMs}
            // convertMsToBeats={convertMsToBeats}
            handleUploadAudio={handleUploadAudio}
          />
        </TracksPanel>
      </MainEditPanel>
      <PianoRollPanel>
        <PianoRoll
          projectId={projectId}
          projectData={projectData}
          tracksData={tracksData}
          selectedTrackId={selectedTrackId}
          selectedTrackIndex={selectedTrackIndex}
        />
      </PianoRollPanel>
    </Container>
  );
};

export default Timeline;
