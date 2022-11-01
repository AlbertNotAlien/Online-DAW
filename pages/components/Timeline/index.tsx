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

const Timeline = () => {
  const playRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const projectInfo = useState(data);

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
              playing={playing}
              progress={progress}
              setProgress={setProgress}
            />
          );
        })}
      </div>
      <button onClick={() => setPlaying(!playing)}>
        {!playing ? "Play" : "Pause"}
      </button>
    </>
  );
};

export default Timeline;
