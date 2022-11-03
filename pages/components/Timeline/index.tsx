import { useState, useEffect, useRef, SetStateAction } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import data from "../.data-structure";

import Bars from "../Bars";
import AudioClip from "../AudioClip";
import { stringLength } from "@firebase/util";

interface StyleProps {
  progressLinePosition: number;
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
  margin-top: 50px;
  display: flex;
  column-gap: 15px;
`;
const AudioClipTitle = styled.div`
  height: 20px;
  width: 100%;
  background-color: darkcyan;

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

interface ProjectsData {
  name: string;
  tempo: number;
}

interface TracksData {
  id: string;
  name: string;
  type: string;
  clips: [
    {
      filedId: string;
      id: string;
      name: string;
      startPoint: number;
      url: string;
    }
  ];
}

const Timeline = () => {
  const [projectData, setProjectData] = useState<ProjectsData>({
    name: "",
    tempo: 0,
  });
  const [tracksData, setTracksdata] = useState<TracksData[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(1); // 小節數
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  const progressIncrementRef = useRef<number | null>(null);

  const barWidthCoefficient = 9.5; // 一個bar長9.5px 9.5:58
  const barWidth = (120 / projectData.tempo) * barWidthCoefficient;

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
    const projectId = "5BbhQTKKkFcM9nCjMG3I";
    const docRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const newData = snapshot.data() as ProjectsData;
      console.log("newData", newData);
      setProjectData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const projectId = "5BbhQTKKkFcM9nCjMG3I";
    const colRef = collection(db, "projects", projectId, "tracks");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const newData = [] as TracksData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TracksData;
        newData.push(docData);
        // newData.push(doc.data());
      });
      console.log("tracksData", newData);
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
    const currentBar = Math.floor(positionX / barWidth);
    setTrackPosition({ x: currentBar, y: 0 });
    console.log(trackPosition);

    tracksData[index].clips[0].startPoint = currentBar;
  };

  const handleClickProgressLine = (e: { clientX: number }) => {
    const positionRemainder =
      e.clientX % ((120 / projectData.tempo) * barWidthCoefficient);
    const currentPosition =
      Math.abs(e.clientX - positionRemainder) < barWidth
        ? 0
        : e.clientX - positionRemainder;
    const currentBar = currentPosition / barWidth + 1;
    setProgress(currentBar);
  };

  const handlePlay = () => {
    if (isPlaying) return;
    console.log("handlePlay");
    setIsPlaying(true);
    progressIncrementRef.current = window.setInterval(() => {
      setProgress((prev) => prev + 0.05);
    }, 50);
  };

  const handlePause = () => {
    if (progressIncrementRef.current && isPlaying) {
      console.log("handlePause");
      setIsPlaying(false);
      clearInterval(progressIncrementRef.current);
    }
  };

  return (
    <>
      <div>timeline</div>
      <Progressline progressLinePosition={(progress - 1) * barWidth} />
      <div>
        {tracksData.map((track, index) => {
          return (
            <Track key={index} onClick={handleClickProgressLine}>
              <Draggable
                axis="x"
                onStop={(event, dragElement) =>
                  handleDraggable(event, dragElement, index)
                }
                grid={[(120 / projectData.tempo) * barWidthCoefficient, 0]}
                defaultPosition={{ x: 0, y: 0 }}
                handle="#handle"
                bounds={{ left: 0 }}
              >
                <div>
                  <AudioClipTitle id="handle">clip</AudioClipTitle>
                  <AudioClip
                    key={index}
                    url={track.clips[0].url}
                    projectData={projectData}
                    // setProjectData={setProjectData}
                    isPlaying={isPlaying}
                    progress={progress}
                    tracksData={tracksData[index]}
                    // setProgress={setProgress}
                  />
                </div>
              </Draggable>
              <Bars projectData={projectData} />
            </Track>
          );
        })}
      </div>
      <Draggable>
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
          <div className="progress">{`${Math.floor(progress)} 小節`}</div>
        </Controls>
      </Draggable>
    </>
  );
};

export default Timeline;
