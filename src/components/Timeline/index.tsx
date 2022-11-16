import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilState } from "recoil";
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
import { db } from "../../../lib/firebase";
import { storage } from "../../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  tracksDataState,
  projectDataState,
  selectedTrackIdState,
  selectedTrackIndexState,
  TrackData,
} from "../../../lib/atoms";
// import TrackBars from "../Tracks/TrackBars/TrackNotes";
import WaveSurfer from "../Tracks/WaveSurfer";
import Record from "../Record";
import Export from "../Export";
import Tracks from "../Tracks";
import PianoRoll from "../PianoRoll";

interface ProgresslineProps {
  progressLinePosition: number;
}

interface ProjectData {
  trackHeight: number;
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
}

// interface IsSoloButtonProps {
//   isSolo: string;
// }

const Progressline = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: darkcyan;
  height: 100%;
  position: absolute;
  left: ${(props) => props.progressLinePosition}px;
  margin-left: 200px;
`;

const Controls = styled.div`
  margin: 20px 0px;
  display: flex;
  column-gap: 15px;
`;

// const MidiRegion = styled.div<MidiRegionProps>`
//   width: ${(props) => props.barWidth * props.length}px;
//   height: 130px;
//   background-color: #ffffff20;
//   /* border: 1px solid #ffffff; */
//   /* margin-left: ${(props) => props.barWidth * 2}px; */
//   position: relative;
// `;

// const MidiNote = styled.div<MidiNoteProps>`
//   width: ${(props) => props.barWidth * 0.25}px;
//   height: 5px;
//   background-color: #ffffff;
//   border: 1px solid #ffffff;
//   position: absolute;
//   bottom: ${(props) => props.pitch * 5}px;
//   left: ${(props) => props.barWidth * 0.25 * props.startTime}px;
// `;

const Timeline = () => {
  const [projectData, setProjectData] =
    useRecoilState<ProjectData>(projectDataState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const projectId = "5BbhQTKKkFcM9nCjMG3I";
  const barWidthCoefficient = projectData.barWidthCoefficient; // 一個bar長 9.5px/58bpm
  const barWidth = (120 / projectData.tempo) * barWidthCoefficient;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  // const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  // const progressIncrementRef = useRef<number>(0);

  const uploadRef = useRef<HTMLInputElement>(null);
  // const loadTotalRef = useRef(null);
  // const progressRef = useRef(null);
  // const audioListRef = ref(storage, `projects/${projectId}/audios`);
  const [audioList, setAudioList] = useState<string[]>([]);

  const secondsRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  // const [selectedTrack, setSelectedTrack] = useState(null);

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
      startTimer(progress);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      pauseTimer();
    } else if (!isPlaying) {
      setProgress(0);
    }
  };

  const startTimer = (prev_seconds: number) => {
    const startTime = new Date();

    intervalRef.current = setInterval(() => {
      const timeElapsed = new Date().getTime() - startTime.getTime(); // milliseconds
      const newMilliseconds = timeElapsed + prev_seconds * 1000;

      secondsRef.current = newMilliseconds / 1000;
      setProgress(secondsRef.current);
    }, 25);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
  };

  const handleProgressLine = (e: MouseEvent<HTMLDivElement>) => {
    const clickPosition = e.clientX - 200;
    if (clickPosition > 0) {
      const positionRemainder = clickPosition % barWidth;
      const currentPosition =
        Math.abs(clickPosition - positionRemainder) < barWidth // 第1小節
          ? 0
          : clickPosition - positionRemainder;
      const currentBar = currentPosition / barWidth;
      setProgress(convertBeatsToMs(currentBar + 1));
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
    console.log("handleUploadAudio");
    console.log("file", file);

    if (file && tracksData) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(file.name || "record");
      const newStartPoint = { bars: 1, quarters: 1, sixteenths: 1 };
      // const newStartPoint = convertMsToBeats(progress);

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
    <>
      <Progressline
        progressLinePosition={
          (convertMsToBeats(progress) - 1) * barWidth * 1.05
        }
      />
      <Controls>
        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause}>Pause</button>
        <span>bpm:</span>
        <input
          type="number"
          value={projectData.tempo}
          onChange={(event) => {
            setProjectData((prev) => ({
              ...prev,
              tempo: parseInt(event.target.value),
            }));
          }}
        ></input>
        <div className="progress">{`${Math.floor(
          convertMsToBeats(progress)
        )} 小節`}</div>
        <div>{`${progress.toFixed(3)} 秒`}</div>
      </Controls>
      <Controls>
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
      </Controls>
      <Controls>
        <Record
          handleUploadAudio={handleUploadAudio}
          handlePlay={handlePlay}
          handlePause={handlePause}
        />
        <Export handleUploadAudio={handleUploadAudio} />
      </Controls>
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
      <PianoRoll
        projectId={projectId}
        projectData={projectData}
        tracksData={tracksData}
        selectedTrackId={selectedTrackId}
        selectedTrackIndex={selectedTrackIndex}
      />
    </>
  );
};

export default Timeline;
