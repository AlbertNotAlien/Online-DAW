// npm install wavesurfer.js
import React, { useState, useEffect, useRef } from "react";
// import WaveSurfer from "wavesurfer.js";
import styled from "styled-components";

import data from "../data-structure";

const Track = styled.div`
  position: relative;
`;

const TimelineBlock = styled.div``;

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

const Timeline = styled.div`
  width: 10px;
  height: 150px;
  background-color: blue;
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
  // cursorWidth: 0,
});

// const WaveSurferNext = (forwardRef = (props, playRef) => {
const WaveSurferNext = (props) => {
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const wavesurfer = useRef(null);

  const [duration, setDuration] = useState(0);
  const barWidth = 9.5; // 一個bar長9.5px 9.5:58
  const barQuantity = parseInt(duration * (props.projectInfo.tempo / 60)); // 產生的小節數量
  const totalWidth = barWidth * barQuantity; // 總長度

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
      wavesurfer.current.load(props.url);
      console.log(props.url);

      wavesurfer.current.on("ready", function () {
        const audioDuration = wavesurfer.current.getDuration();
        console.log("audioDuration", audioDuration);
        setDuration(audioDuration);
        // setAudioInfo((prev) => ({
        //   ...prev,
        //   duration: audioDuration,
        // }));
      });

      wavesurfer.current.on("audioprocess", function () {
        const currentTime = wavesurfer.current.getCurrentTime();
        props.setProgress(currentTime * (props.projectInfo.tempo / 60));
      });

      wavesurfer.current.on("seek", function () {
        const currentTime = wavesurfer.current.getCurrentTime();
        // const seekTo = wavesurfer.current.seekTo(0.5);
        // const seekTo = wavesurfer.current.seekTo(currentTime / duration);
        props.setProgress(currentTime * (props.projectInfo.tempo / 60));
        console.log(currentTime);
      });
    };

    create();

    return () => {
      if (wavesurfer.current) {
        console.log("destroy");
        wavesurfer.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    console.log("!");
    console.log(wavesurfer.current);
    wavesurfer.current?.playPause();
  }, [props.isPlaying, wavesurfer.current]);

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
                      <BarLight
                        width={(60 / props.projectInfo.tempo) * barWidth}
                      />
                    </div>
                  );
                })}
                {new Array(4).fill(0).map((_, index) => {
                  return (
                    <div key={index}>
                      <BarDark
                        width={(60 / props.projectInfo.tempo) * barWidth}
                      />
                    </div>
                  );
                })}
              </FlexBars>
            );
          })}
        </Bars>
      </Track>
      <TimelineBlock id="wave-timeline" ref={timelineRef} />
      {/* <div className="progress">{`${Math.floor(props.progress)} 小節`}</div> */}
    </div>
  );
};
// });

export default WaveSurferNext;
