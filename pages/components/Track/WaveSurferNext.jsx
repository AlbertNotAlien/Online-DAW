// npm install wavesurfer.js
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

import data from "./data-structure";

console.log(data);

const bpm = 58;
const duration = 120.0; // 120.000
const barWidth = 9.5; // 一個bar長9.5px 9.5:58
const barQuantity = duration * (bpm / 60); // 產生的小節數量
const totalWidth = barWidth * barQuantity; // 總長度

const Track = styled.div`
  /* width: 100%; */
  position: relative;
`;

const TimelineBlock = styled.div`
  /* width: ${totalWidth}px; */
  /* width: 500px; */
  /* height: 100px; */
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
  cursor: pointer;
  &:hover {
    border-left: 0.1px solid white;
  }
`;

const BarLight = styled(Bar)`
  padding: 0 ${(props) => props.width}px;
  background-color: #2d2d2d;
`;

const BarDark = styled(Bar)`
  padding: 0 ${(props) => props.width}px;
  background-color: #141414;
`;

const Controls = styled.div`
  margin-top: 50px;
  display: flex;
  column-gap: 15px;
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
  const [audioInfo, setAudioInfo] = useState({ duration: 0 });
  const [zoom, setZoom] = useState(1);

  console.log(zoom);

  const url =
    "https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3";

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const TimelinePlugin = (await import("wavesurfer.js/src/plugin/timeline"))
        .default;

      const options = formWaveSurferOptions(waveformRef.current);
      options.plugins.push(
        TimelinePlugin.create({
          container: "#wave-timeline",
          timeInterval: 1,
          primaryColor: "blue",
          primaryFontColor: "blue",
          secondaryColor: "red",
          secondaryFontColor: "red",
          offset: 0,
        })
      );

      wavesurfer.current = WaveSurfer.create(options);
      wavesurfer.current.load(url);

      wavesurfer.current.on("ready", function () {
        const audioDuration = wavesurfer.current.getDuration();
        console.log("audioDuration", audioDuration);
        setAudioInfo((prev) => ({
          ...prev,
          duration: audioDuration,
        }));
      });

      wavesurfer.current.on("audioprocess", function () {
        const currentTime = wavesurfer.current.getCurrentTime();
        setProgress(currentTime * (bpm / 60));
      });

      wavesurfer.current.on("seek", function () {
        const currentTime = wavesurfer.current.getCurrentTime();
        setProgress(currentTime * (bpm / 60));
        console.log(currentTime);
      });
    };

    create();
    console.log("round");

    return () => {
      if (wavesurfer.current) {
        console.log("destroy");
        wavesurfer.current.destroy();
      }
    };
  }, []);

  const handlePlayPause = () => {
    setPlaying(!playing);
    wavesurfer.current.playPause();
  };

  const handleZoomIn = () => {
    setZoom((prev) => prev * 2);
  };

  const handleZoomOut = () => {
    setZoom((prev) => prev / 2);
  };

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
                      <BarLight width={zoom * barWidth} />
                    </div>
                  );
                })}
                {new Array(4).fill(0).map((_, index) => {
                  return (
                    <div key={index}>
                      <BarDark width={zoom * barWidth} />
                    </div>
                  );
                })}
              </FlexBars>
            );
          })}
        </Bars>
      </Track>
      <TimelineBlock id="wave-timeline" ref={timelineRef} />
      <Controls>
        <button onClick={handlePlayPause}>{!playing ? "Play" : "Pause"}</button>
        <button onClick={handleZoomIn}>zoom in</button>
        <button onClick={handleZoomOut}>zoom out</button>
      </Controls>
      <div className="progress">{`${Math.floor(progress)} 小節`}</div>
    </div>
  );
}

export default WaveSurferNext;
