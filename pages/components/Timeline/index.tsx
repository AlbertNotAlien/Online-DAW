import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import data from "../.data-structure";

import Bars from "../Bars";
import AudioClip from "../AudioClip";

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

const Timeline = () => {
  const [projectInfo, setProjectInfo] = useState(data.projects[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 秒數
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  const [progressLinePosition, setProgressLinePosition] = useState(0);

  const barWidthCoefficient = 9.5; // 一個bar長9.5px 9.5:58
  const barWidth = (120 / projectInfo.tempo) * barWidthCoefficient;

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
    const colRef = collection(db, "projects", projectId, "tracks");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      snapshot.forEach((doc) => {
        console.log(doc.data());
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDraggable = (
    event: any,
    dragElement: { x: number; y: number }
  ) => {
    const positionX = Math.abs(dragElement.x) < barWidth ? 0 : dragElement.x;
    const currentBar = Math.floor(positionX / barWidth) + 1;
    setTrackPosition({ x: currentBar, y: 0 });
    console.log(trackPosition);

    // 1. 設id
    // 2. 用id來findIndex
    // 3. immer / firebase

    projectInfo.tracks[0].clips[0].startPoint = currentBar;
  };

  const setProgressLine = (e: { clientX: number }) => {
    const remainder =
      e.clientX % ((120 / projectInfo.tempo) * barWidthCoefficient);
    const currentPosition =
      Math.abs(e.clientX - remainder) < barWidth ? 0 : e.clientX - remainder;
    const currentBar = currentPosition / barWidth + 1;
    setProgressLinePosition(currentPosition);
    setProgress(currentBar);
  };

  return (
    <>
      <div>timeline</div>
      <Progressline progressLinePosition={progressLinePosition} />
      <div>
        {data.projects[0].tracks.map((track, index) => {
          return (
            <Track key={index} onClick={setProgressLine}>
              <Draggable
                axis="x"
                onDrag={(event, dragElement) =>
                  handleDraggable(event, dragElement)
                }
                grid={[(120 / projectInfo.tempo) * barWidthCoefficient, 0]}
                defaultPosition={{ x: 0, y: 0 }}
                handle="#handle"
                bounds={{ left: 0 }}
              >
                <div>
                  <AudioClipTitle id="handle">clip</AudioClipTitle>
                  <AudioClip
                    key={index}
                    url={track.clips[0].url}
                    projectInfo={projectInfo}
                    setProjectInfo={setProjectInfo}
                    isPlaying={isPlaying}
                    progress={progress}
                    setProgress={setProgress}
                  />
                </div>
              </Draggable>
              <Bars projectInfo={projectInfo} />
            </Track>
          );
        })}
      </div>
      <Draggable>
        <Controls>
          <button onClick={() => setIsPlaying(!isPlaying)}>
            {!isPlaying ? "Play" : "Pause"}
          </button>
          <span>bpm:</span>
          <input
            type="number"
            value={projectInfo.tempo}
            onChange={(event) => {
              setProjectInfo((prev) => ({
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
