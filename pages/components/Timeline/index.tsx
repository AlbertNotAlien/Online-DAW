import { useState, useEffect, useRef, SetStateAction } from "react";
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
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { storage } from "../../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import Bars from "../Bars";
import WaveSurfer from "../AudioClip";
import Record from "../Record";

interface StyleProps {
  progressLinePosition: number;
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
      fileName: string;
      startPoint: number;
      url: string;
    }
  ];
}

const Progressline = styled.div<StyleProps>`
  width: 1px;
  background-color: darkcyan;
  height: 100%;
  position: absolute;
  left: ${(props) => props.progressLinePosition}px;
`;

const Track = styled.div`
  position: relative;
`;

const Controls = styled.div`
  margin: 20px 0px;
  display: flex;
  column-gap: 15px;
`;

const WaveSurferTitle = styled.div`
  height: 20px;
  width: 100%;
  background-color: darkcyan;

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
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
  const [progress, setProgress] = useState(1); // 小節數
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  const progressIncrementRef = useRef<number | null>(null);

  const uploadRef = useRef<HTMLInputElement>(null);
  const audioListRef = ref(storage, `projects/${projectId}/audios`);
  const [audioList, setAudioList] = useState<string[]>([]);

  console.log("tracksData", tracksData);

  const convertTimeToBars = (sec: number) => {
    const bars = (sec * projectData.tempo) / (60 * 2) + 1;
    return bars;
  };

  const convertBarsToTime = (bars: number) => {
    const sec = ((bars - 1) * (60 * 2)) / projectData.tempo;
    return sec;
  };

  // useEffect(() => {
  //   //project
  //   const docRef = doc(db, "projects", "5BbhQTKKkFcM9nCjMG3I");
  //   const unsubscribe = onSnapshot(docRef, (snapshot) => {
  //     console.log(snapshot.data());
  //   });

  //   return () => {
  //     unsubscribe();
  //   };
  // }, []);

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

  const handleDraggable = (
    event: any,
    dragElement: { x: number; y: number },
    index: number
  ) => {
    const positionX = Math.abs(dragElement.x) < barWidth ? 0 : dragElement.x;
    const currentBar = Math.floor(positionX / barWidth) + 1;
    setTrackPosition({ x: currentBar, y: 0 });
    tracksData[index].clips[0].startPoint = convertBarsToTime(currentBar);
  };

  const handleClickProgressLine = (e: { clientX: number }) => {
    const positionRemainder = e.clientX % barWidth;
    const currentPosition =
      Math.abs(e.clientX - positionRemainder) < barWidth
        ? 0
        : e.clientX - positionRemainder;
    const currentBar = currentPosition / barWidth + 1;
    setProgress(convertBarsToTime(currentBar));
  };

  useEffect(() => {
    listAll(audioListRef).then((response) => {
      response.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          setAudioList((prev) => [...prev, url]);
        });
      });
    });
  }, []);

  // console.log(audioList);

  const handlePlay = () => {
    if (isPlaying) return;

    const incrementFrequency = 20;
    progressIncrementRef.current = window.setInterval(() => {
      setProgress(
        (prev) => prev + convertBarsToTime(1 / incrementFrequency + 1)
      );
    }, 1000 / incrementFrequency);
    setIsPlaying(true);
  };

  const handlePause = () => {
    if (progressIncrementRef.current && isPlaying) {
      clearInterval(progressIncrementRef.current);
      setIsPlaying(false);
    }
  };

  const appendToFilename = (filename: string) => {
    const dotIndex = filename.lastIndexOf(".");
    const date = new Date();
    const fileDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;
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
  };

  const handleUploadAudio = () => {
    const files = uploadRef.current?.files;
    console.log("files", files);
    if (files && files?.length > 0) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(files[0].name);
      const newStartPoint = convertTimeToBars(progress);

      const audioRef = ref(
        storage,
        `projects/${projectId}/audios/${newFileName}`
      );
      // const audioRef = ref(storage, `audios/${files[0].name + v4()}`);

      uploadBytes(audioRef, files[0]).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          setAudioList((prev) => [...prev, url]);

          uploadFileInfo(
            newTrackName,
            "audio",
            newFileName,
            newStartPoint,
            url
          );
        });
      });
    }
  };

  const uploadFileInfo = async (
    trackName: string,
    type: string,
    fileName: string,
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
            fileName: fileName,
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

  console.log(audioList);

  return (
    <>
      <Progressline
        progressLinePosition={(convertTimeToBars(progress) - 1) * barWidth}
      />
      <Controls>
        <button onClick={() => handlePlay()}>Play</button>
        <button onClick={() => handlePause()}>Pause</button>
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
      </Controls>
      <Controls>
        <input
          type="file"
          accept=".mp3,audio/*"
          multiple={false}
          ref={uploadRef}
          // onInput={handleUploadAudio}
        />
        <button onClick={handleUploadAudio}>Upload Audio</button>
      </Controls>
      <Controls>
        <Record />
      </Controls>
      <div>
        {tracksData.map((track, index) => {
          return (
            <Track key={index} onClick={handleClickProgressLine}>
              <Draggable
                axis="x"
                onStop={(event, dragElement) =>
                  handleDraggable(event, dragElement, index)
                }
                grid={[barWidth, 0]}
                defaultPosition={{
                  x:
                    convertBarsToTime(
                      tracksData[index].clips[0].startPoint - 1
                    ) * barWidth,
                  y: 0,
                }}
                handle="#handle"
                bounds={{ left: 0 }}
              >
                <div>
                  <WaveSurferTitle id="handle">clip</WaveSurferTitle>
                  <WaveSurfer
                    key={index}
                    url={track.clips[0].url}
                    projectData={projectData}
                    isPlaying={isPlaying}
                    progress={progress}
                    tracksData={tracksData[index]}
                    convertTimeToBars={convertTimeToBars}
                    convertBarsToTime={convertBarsToTime}
                  />
                </div>
              </Draggable>
              <Bars projectData={projectData} />
            </Track>
          );
        })}
      </div>
    </>
  );
};

export default Timeline;
