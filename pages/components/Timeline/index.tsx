import { useState, useEffect, useRef, FC } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
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
import { db } from "../../../config/firebase";
import { storage } from "../../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import Bars from "../Bars";
import WaveSurfer from "../AudioClip";
import Record from "../Record";
import useRecorder from "../Record/useRecorder";
import Tone from "../ToneJs";
import Scribbletune from "../Scribbletune";
// import PianoRoll from "../PianoRoll";

interface ProgresslineProps {
  progressLinePosition: number;
}

interface MidiRegionProps {
  barWidth: number;
  length: number;
}

interface MidiNoteProps {
  barWidth: number;
  startTime: number;
  pitch: number;
}

interface ProjectsData {
  name: string;
  tempo: number;
}

interface TracksData {
  id: string;
  trackName: string;
  type: string;
  clips: [
    {
      clipName: string;
      startPoint: number;
      url: string;
    }
  ];
}

const Progressline = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: darkcyan;
  height: 100%;
  position: absolute;
  left: ${(props) => props.progressLinePosition}px;
  /* top: 0px; */
`;

const Track = styled.div`
  position: relative;
`;

const Controls = styled.div`
  margin: 20px 0px;
  display: flex;
  column-gap: 15px;
`;

const ClipTitle = styled.div`
  height: 20px;
  width: 100%;
  padding-left: 10px;
  background-color: darkcyan;

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const MidiRegion = styled.div<MidiRegionProps>`
  width: ${(props) => props.barWidth * props.length}px;
  height: 130px;
  background-color: #ffffff30;
  border: 1px solid #ffffff;
  margin-left: ${(props) => props.barWidth * 2}px;
  position: relative;
`;

const MidiNote = styled.div<MidiNoteProps>`
  width: ${(props) => props.barWidth * 0.25}px;
  height: 5px;
  background-color: #ffffff;
  border: 1px solid #ffffff;
  position: absolute;
  bottom: ${(props) => props.pitch * 5}px;
  left: ${(props) => props.barWidth * 0.25 * props.startTime}px;
`;

const Timeline = () => {
  const [projectData, setProjectData] = useState<ProjectsData>({
    name: "",
    tempo: 0,
  });
  const [tracksData, setTracksdata] = useState<TracksData[]>([]);
  const projectId = "5BbhQTKKkFcM9nCjMG3I";
  const barWidthCoefficient = 9.5; // 一個bar長9.5px 9.5:58
  const barWidth = (120 / projectData.tempo) * barWidthCoefficient;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 毫秒
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  const progressIncrementRef = useRef<number | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const audioListRef = ref(storage, `projects/${projectId}/audios`);
  const [audioList, setAudioList] = useState<string[]>([]);

  const recordRef = useRef<HTMLDivElement>(null);
  let [recordFile, recordURL, isRecording] = useRecorder();

  // console.log("progress", progress);
  // console.log("tracksData", tracksData);

  const convertTimeToBars = (sec: number) => {
    const bars = (sec * projectData.tempo) / 60 + 1;
    return bars;
  };

  const convertBarsToTime = (bars: number) => {
    const sec = ((bars - 1) * 60) / projectData.tempo;
    return sec;
  };

  useEffect(() => {
    const docRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const newData = snapshot.data() as ProjectsData;
      setProjectData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const colRef = collection(db, "projects", projectId, "tracks");
    // const q = (colRef, orderBy(""));
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const newData = [] as TracksData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TracksData;
        newData.push(docData);
      });
      setTracksdata(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    listAll(audioListRef).then((response) => {
      response.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          setAudioList((prev) => [...prev, url]);
        });
      });
    });
  }, []);

  const handleClipDraggable = (
    event: any,
    dragElement: { x: number; y: number },
    index: number
  ) => {
    const positionX = Math.abs(dragElement.x) < barWidth ? 0 : dragElement.x;
    const currentBar = Math.floor(positionX / barWidth) + 1;
    setTrackPosition({ x: currentBar, y: 0 });
    tracksData[index].clips[0].startPoint = convertBarsToTime(currentBar);
  };

  // console.log(audioList);

  const handlePlay = () => {
    const incrementFrequency = 20;
    if (!isPlaying) {
      progressIncrementRef.current = window.setInterval(() => {
        setProgress((prev) => Number(prev + 1 / incrementFrequency));
      }, 1000 / incrementFrequency);
      setIsPlaying(true);
    }
  };

  // const handlePlay = () => {
  //   setIsPlaying(true);
  // };

  // useEffect(() => {
  //   const incrementFrequency = 100;
  //   if (isPlaying) {
  //     progressIncrementRef.current = window.setInterval(() => {
  //       setProgress((prev) =>
  //         Number((prev + 1 / incrementFrequency).toFixed(3))
  //       );
  //       console.log("test");
  //     }, 1000 / incrementFrequency);
  //   }
  //   return () => {
  //     if (progressIncrementRef.current && isPlaying) {
  //       clearInterval(progressIncrementRef.current);
  //     }
  //   };
  // }, [isPlaying]);

  const handlePause = () => {
    if (progressIncrementRef.current && isPlaying) {
      clearInterval(progressIncrementRef.current);
      setIsPlaying(false);
    }
  };

  const handleClickProgressLine = (e: { clientX: number }) => {
    const positionRemainder = e.clientX % barWidth;
    const currentPosition =
      Math.abs(e.clientX - positionRemainder) < barWidth // 第1小節
        ? 0
        : e.clientX - positionRemainder;
    const currentBar = currentPosition / barWidth;
    setProgress(convertBarsToTime(currentBar + 1));
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
    startPoint: number,
    url: string
  ) => {
    try {
      const trackRef = doc(collection(db, "projects", projectId, "tracks"));
      const newTrack = {
        id: trackRef.id,
        trackName: trackName,
        type: type,
        clips: [
          {
            clipName: clipName,
            startPoint: startPoint,
            url: url,
          },
        ],
      };
      await setDoc(trackRef, newTrack);
      console.log("info uploaded");
    } catch (err) {
      console.log(err);
    }
  };

  const handleUploadAudio = (file: any) => {
    console.log("handleUploadAudio");
    console.log("file", file);

    if (file) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(file.name || "sample");
      const newStartPoint = 1;
      // const newStartPoint = convertTimeToBars(progress);

      const audioRef = ref(
        storage,
        `projects/${projectId}/audios/${newFileName}`
      );

      // const audioRef = ref(storage, `audios/${file.name + v4()}`);

      console.log("file", file);

      uploadBytes(audioRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          setAudioList((prev) => [...prev, url]);

          uploadFileInfo(
            newTrackName,
            "audio",
            newFileName,
            newStartPoint,
            url
          );
          console.log("uploadBytes");
        });
      });
    }
  };

  return (
    <>
      <Progressline
        progressLinePosition={(convertTimeToBars(progress) - 1) * barWidth}
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
          convertTimeToBars(progress)
        )} 小節`}</div>
        <div>{`${progress.toFixed(3)} 秒`}</div>
      </Controls>
      <Controls>
        <input
          type="file"
          accept=".mp3,audio/*"
          multiple={false}
          ref={uploadRef}
          // onInput={handleUploadAudio}
        />
        <button
          onClick={() => {
            if (uploadRef.current?.files) {
              handleUploadAudio(uploadRef.current?.files[0]);
            }
          }}
        >
          Upload Audio
        </button>
      </Controls>
      <Controls>
        <Record handleUploadAudio={handleUploadAudio} />
      </Controls>
      <div>
        {tracksData.length > 0 &&
          tracksData.map((track, index) => {
            return (
              <Track
                key={`${track.trackName}-${index}`}
                onClick={handleClickProgressLine}
              >
                <Draggable
                  axis="x"
                  onStop={(event, dragElement) =>
                    handleClipDraggable(event, dragElement, index)
                  }
                  grid={[barWidth, 0]}
                  defaultPosition={{
                    x:
                      convertBarsToTime(tracksData[index].clips[0].startPoint) *
                      barWidth,
                    y: 0,
                  }}
                  handle="#handle"
                  bounds={{ left: 0 }}
                >
                  {track.type === "audio" ? (
                    <div>
                      <ClipTitle id="handle">
                        {track.clips[0].clipName}
                      </ClipTitle>
                      <WaveSurfer
                        key={index}
                        index={index}
                        url={track.clips[0].url}
                        projectData={projectData}
                        isPlaying={isPlaying}
                        progress={progress}
                        tracksData={tracksData[index]}
                        convertTimeToBars={convertTimeToBars}
                        convertBarsToTime={convertBarsToTime}
                      />
                    </div>
                  ) : (
                    <>
                      <ClipTitle>{track.clips[0].clipName}</ClipTitle>
                      <MidiRegion barWidth={barWidth} length={3}>
                        <MidiNote
                          barWidth={barWidth}
                          startTime={0}
                          pitch={10}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={1}
                          pitch={12}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={2}
                          pitch={15}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={3}
                          pitch={10}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={4}
                          pitch={12}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={5}
                          pitch={15}
                        />
                      </MidiRegion>
                    </>
                  )}
                </Draggable>
                <Bars projectData={projectData} />
              </Track>
            );
          })}
      </div>
      <Tone
        isPlaying={isPlaying}
        tracksData={tracksData}
        projectData={projectData}
      />
      {/* <Scribbletune /> */}
    </>
  );
};

export default Timeline;
