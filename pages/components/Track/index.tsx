import styled from "styled-components";
import { useRef, useEffect } from "react";

import WaveSurfer from "wavesurfer.js";

// // commonjs/requirejs
// const WaveSurfer = require("wavesurfer.js");

// // amd
// define(["WaveSurfer"], function (WaveSurfer) {
//   // ... code
// });

const Measure = styled.div`
  display: flex;
`;

const Bar = styled.div`
  display: flex;
  width: 100px;
  height: 100px;
  justify-content: center;
  background-color: white;
`;

const Track = () => {
  // const wavesurfer = WaveSurfer.create({
  //   container: "#waveform",
  //   waveColor: "violet",
  //   progressColor: "purple",
  // });

  const waveformRef = useRef<HTMLHeadingElement>(null);

  // useEffect(() => {
  //   if (waveformRef.current) {
  //     const wavesurfer = WaveSurfer.create({
  //       container: waveformRef.current,
  //       waveColor: "#A8DBA8",
  //       progressColor: "#3B8686",
  //     });
  //   }
  // }, []);

  return (
    <>
      <Measure>
        {new Array(4).fill(0).map((_, index) => {
          return <Bar key={index}></Bar>;
        })}
      </Measure>
      {/* <audio controls src="/audio/20220104_test.mp3"></audio> */}
      {/* <div ref={waveformRef}></div> */}
    </>
  );
};

export default Track;
