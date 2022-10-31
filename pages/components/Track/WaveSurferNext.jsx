// npm install wavesurfer.js
// import Timeline from "wavesurfer.js/dist/plugin/wavesurfer.timeline.js";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Bar = styled.div`
  width: 500px;
`;

const formWaveSurferOptions = (waveformRef, timelineRef) => ({
  container: waveformRef,
  waveColor: "#eee",
  progressColor: "#0178FF",
  cursorColor: "OrangeRed",
  // barWidth: 3,
  // barRadius: 3,
  responsive: true,
  height: 150,
  normalize: true,
  partialRender: true,
  plugins: [
    // Timeline.create({
    //   container: timelineRef,
    // }),
  ],
});

function WaveSurferNext() {
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const wavesurfer = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  console.log(Math.floor(progress));

  const url =
    "https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3";

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const MarkersPlugin = (await import("wavesurfer.js/src/plugin/markers"))
        .default;
      const TimelinePlugin = (await import("wavesurfer.js/src/plugin/timeline"))
        .default;

      const options = formWaveSurferOptions(
        waveformRef.current,
        timelineRef.current
      );
      options.plugins.push(
        MarkersPlugin.create({
          markers: [
            {
              time: 58,
              label: "",
              color: "#ff990a",
            },
            {
              time: 5.5,
              label: "",
              color: "#ff990a",
            },

            {
              time: 24,
              label: "END",
              color: "#00ffcc",
              position: "top",
            },
          ],
        }),
        TimelinePlugin.create({
          container: timelineRef,
        })
      );

      wavesurfer.current = WaveSurfer.create(options);
      wavesurfer.current.load(url);
      // wavesurfer.current.load(require(url));

      wavesurfer.current.on("marker-click", function (marker) {
        console.log("marker drop", marker);
      });

      wavesurfer.current.on("audioprocess", function () {
        const currentTime = wavesurfer.current.getCurrentTime();
        setProgress(currentTime);
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

  const handlePlayPause = () => {
    setPlaying(!playing);
    wavesurfer.current.playPause();
  };

  const back30 = () => {
    wavesurfer.current.skipBackward(30);
  };

  const forward30 = () => {
    wavesurfer.current.skipForward(30);
  };

  return (
    <div>
      <Bar id="waveform" ref={waveformRef} />
      <Bar ref={timelineRef} />
      <div className="controls">
        <div onClick={back30}>Back 30</div>
        <button onClick={handlePlayPause}>{!playing ? "Play" : "Pause"}</button>
        <div onClick={forward30}>Forward 30</div>
      </div>
      <div className="progress">{Math.floor(progress)}</div>
    </div>
  );
}

export default WaveSurferNext;
