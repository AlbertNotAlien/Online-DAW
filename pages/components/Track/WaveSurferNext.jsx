// npm install wavesurfer.js
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

import data from "./data-structure";

console.log(data);

const bpm = data.projects[0].tempo;
const duration = 120.0; // 120.000
const barWidth = 10; // 一個bar長10px
const barQuantity = duration * (bpm / 60); // 產生的小節數量
const totalWidth = barWidth * barQuantity; // 總長度

const Track = styled.div`
  /* width: 100%; */
  width: ${totalWidth}px;
  position: relative;
`;

const TimelineBlock = styled.div`
  width: ${totalWidth}px;
  /* width: 500px; */
  height: 100px;
`;

const Bars = styled.div`
  display: flex;
  flex-direction: row;
  position: absolute;
  z-index: 0;
`;

const FlexBars = styled.div`
  display: flex;
  flex-direction: row;
`;

const Bar = styled.div`
  width: 1px;
  height: 150px;
  border-left: 0.1px solid gray;
  padding: 0 ${barWidth}px;
  cursor: pointer;
  &:hover {
    border-left: 0.1px solid white;
  }
`;

const BarLight = styled(Bar)`
  background-color: #2d2d2d;
`;

const BarDark = styled(Bar)`
  background-color: #141414;
`;

const formWaveSurferOptions = (waveformRef) => ({
  container: waveformRef,
  waveColor: "#eee",
  progressColor: "#0178FF",
  cursorColor: "OrangeRed",
  responsive: true,
  height: 150,
  normalize: true,
  partialRender: true,
  fillParent: false,
  plugins: [],
});

function WaveSurferNext() {
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const wavesurfer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const url =
    "https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3";

  const create = async () => {
    const WaveSurfer = (await import("wavesurfer.js")).default;

    const options = formWaveSurferOptions(waveformRef.current);
    wavesurfer.current = WaveSurfer.create(options);

    wavesurfer.current.load(url);
  };

  useEffect(() => {
    create();

    return () => {
      console.log(wavesurfer.current);
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, []);

  const handlePlayPause = () => {
    setPlaying(!playing);
    wavesurfer.current.playPause();
  };

  // const back30 = () => {
  //   wavesurfer.current.skipBackward(30);
  // };

  // const forward30 = () => {
  //   wavesurfer.current.skipForward(30);
  // };

  return (
    <div>
      <Track id="waveform" ref={waveformRef}>
        <Bars>
          {new Array(parseInt(barQuantity / 8)).fill(0).map((_, index) => {
            return (
              <FlexBars key={index}>
                {new Array(4).fill(0).map((_, index) => {
                  return (
                    <div key={index}>
                      <BarLight />
                    </div>
                  );
                })}
                {new Array(4).fill(0).map((_, index) => {
                  return (
                    <div key={index}>
                      <BarDark />
                    </div>
                  );
                })}
              </FlexBars>
            );
          })}
        </Bars>
      </Track>
      <TimelineBlock id="wave-timeline" ref={timelineRef} />
      <div className="controls">
        <button onClick={handlePlayPause}>{!playing ? "Play" : "Pause"}</button>
      </div>
      <div className="progress">{Math.floor(progress)}</div>
    </div>
  );
}

export default WaveSurferNext;
