import { forwardRef, useRef, useImperativeHandle, useState } from "react";
import styled from "styled-components";

import Track from "../Track";
import data from "../data-structure";

console.log(data);
console.log(data.projects[0]);

const Progressline = styled.div`
  width: 1px;
  background-color: red;
  height: 100%;
  position: absolute;
  top: 0;
`;

const Controls = styled.div`
  margin-top: 50px;
  display: flex;
  column-gap: 15px;
`;

const Timeline = () => {
  const [projectInfo, setProjectInfo] = useState(data.projects[0]);
  // console.log(projectInfo);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <>
      <div>timeline</div>
      <div>
        {data.projects[0].tracks.map((track, index) => {
          <Progressline />;
          return (
            <Track
              key={index}
              url={track.clips[0].url}
              projectInfo={projectInfo}
              setProjectInfo={setProjectInfo}
              isPlaying={isPlaying}
              progress={progress}
              setProgress={setProgress}
            />
          );
        })}
      </div>
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
    </>
  );
};

export default Timeline;
