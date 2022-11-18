import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
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
import { db } from "../../lib/firebase";
import { storage } from "../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  isMetronomeState,
  TrackData,
} from "../../lib/atoms";
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

const HeadBarPanel = styled.div`
  display: flex;
  justify-content: space-between;
  background-color: gray;
  padding: 10px;
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
  &:hover {
    transform: scale(110%);
  }
`;

// const Record = styled(Button)``;

const PlayControls = styled.div`
  display: flex;
`;

const TempoInput = styled.input`
  width: 50px;
  text-align: center;
  border: none;
  border-radius: 3px;
  height: 100%;
  background-color: #323232;
  border-radius: 10px;
`;

const ProgressControls = styled.div`
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

  const [isPlaying, setIsPlaying] = useState(false);

  const uploadRef = useRef<HTMLInputElement>(null);
  const [audioList, setAudioList] = useState<string[]>([]);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const [progress, setProgress] = useRecoilState(progressState);
  console.log("progress", progress);
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

  const convertMsToBeats = (sec: number) => {
    const bars = (sec * projectData.tempo) / 60 + 1;
    return bars;
  };

  const convertBeatsToMs = (bars: number) => {
    const millisecond = (bars * 60) / projectData.tempo;
    // console.log("convertBeatsToMs", millisecond);
    return millisecond;
  };

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      // startTimer(progress);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      // pauseTimer();
    }
    // } else if (!isPlaying) {
    //   setProgress({
    //     bars: 0,
    //     quarters: 0,
    //     sixteenths: 0,
    //   });
    // }
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
    console.log("handleUploadAudio");
    console.log("file", file);

    if (file && tracksData) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(file.name || "record");
      const newStartPoint = { bars: 1, quarters: 1, sixteenths: 1 };

      const audioRef = ref(
        storage,
        `projects/${projectId}/audios/${newFileName}`
      );

      // const audioRef = ref(storage, `audios/${file.name + v4()}`);

      // console.log("file", file);

      uploadBytes(audioRef, file).then((snapshot) => {
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
      });
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
        <TempoInput
          type="text"
          inputMode="numeric"
          value={projectData.tempo}
          min={1}
          required
          onChange={(event) => {
            setProjectData((prev) => ({
              ...prev,
              tempo: parseInt(event.target.value),
            }));
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
        <ProgressControls>
          <ProgressInput value={`${progress.bars + 1}`} />
          <ProgressInput value={`${progress.quarters + 1}`} />
          <ProgressInput value={`${Math.floor(progress.sixteenths + 1)}`} />
        </ProgressControls>
        <PlayControls>
          <Button onClick={handlePlay}>
            <Image
              src={
                isPlaying && !isRecording
                  ? "/play-button-activated.svg"
                  : "/play-button.svg"
              }
              alt={""}
              width={20}
              height={20}
            />
          </Button>
          <Button onClick={handlePause}>
            <Image src="/stop-button.svg" alt={""} width={20} height={20} />
          </Button>
          <Record
            handlePlay={handlePlay}
            handlePause={handlePause}
            handleUploadAudio={handleUploadAudio}
          />
        </PlayControls>

        <input
          type="file"
          accept=".mp3,audio/*"
          multiple={false}
          ref={uploadRef}
          onInput={() => {
            if (uploadRef.current?.files) {
              handleUploadAudio(uploadRef.current?.files[0]);
            }
          }}
        />

        <Button>
          <Export />
        </Button>
      </HeadBarPanel>
      <MainEditPanel>
        <Library />
        <TracksPanel>
          <Tracks
            isPlaying={isPlaying}
            // projectData={projectData}
            // trackData={tracksData[index]}
            // barWidth={barWidth}
            progress={progress}
            convertBeatsToMs={convertBeatsToMs}
            convertMsToBeats={convertMsToBeats}
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
