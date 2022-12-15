import { useState, useEffect, SetStateAction } from "react";
import styled from "styled-components";
import Draggable from "react-draggable";

import data from "../data-structure";

import Bars from "../Bars";
import AudioClip from "../AudioClip";
import { ECDH } from "crypto";

interface StyleProps {
  progressLinePosition: number;
}

console.log(data);
console.log(data.projects[0]);

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
  // console.log(projectInfo);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  console.log("progress", progress);

  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  // console.log(trackPosition);
  const [progressLinePosition, setProgressLinePosition] = useState(0);

  const barWidth = 9.5; // 一個bar長9.5px 9.5:58

  const trackPos = (position: { x: number; y: number }) => {
    setTrackPosition({ x: position.x, y: position.y });
  };

  const mouseClick = (e: { clientX: number }) => {
    const remainder = e.clientX % ((120 / projectInfo.tempo) * barWidth);
    setProgressLinePosition(e.clientX - remainder);
  };

  return (
    <>
      <div>timeline</div>
      <Progressline progressLinePosition={progressLinePosition} />
      <div>
        {data.projects[0].tracks.map((track, index) => {
          return (
            <Track key={index} onClick={mouseClick}>
              <Draggable
                axis="x"
                onDrag={(e, position) => trackPos(position)}
                grid={[(120 / projectInfo.tempo) * barWidth, 0]}
                defaultPosition={{ x: 0, y: 0 }}
                handle="#handle"
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
