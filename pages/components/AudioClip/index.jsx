import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Clip = styled.div`
  position: relative;
`;

const TimelineBlock = styled.div``;

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
  interact: false,
});

const AudioClip = (props) => {
  const waveformRef = useRef(null);
  const timelineRef = useRef(null);
  const wavesurfer = useRef(null);

  const [duration, setDuration] = useState(0);

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
      // console.log(props.url);

      wavesurfer.current.on("ready", function () {
        const audioDuration = wavesurfer.current.getDuration();
        console.log("audioDuration", audioDuration, "sec");
        setDuration((audioDuration * props.projectData.tempo) / 60);
        // setProjectData((prev) => ({
        //   ...prev,
        //   duration: audioDuration, ///////////////////////////////////////////////////////////////////////////////////
        // }));
      });

      // wavesurfer.current.on("audioprocess", function () {
      //   const currentTime = wavesurfer.current.getCurrentTime();
      //   props.setProgress(currentTime * (props.projectData.tempo / 60));
      // });

      // wavesurfer.current.on("seek", function () {
      //   const currentTime = wavesurfer.current.getCurrentTime();
      //   // const seekTo = wavesurfer.current.seekTo(0.5);
      //   // const seekTo = wavesurfer.current.seekTo(currentTime / duration);
      //   props.setProgress(currentTime * (props.projectData.tempo / 60));
      //   console.log(currentTime);
      // });
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
    console.log("duration", duration);
    // console.log("props.isPlaying", props.isPlaying);
    // console.log("props.progress", props.progress);
    // console.log("props.tracksData", props.tracksData);

    if (!props.isPlaying && wavesurfer.current) {
      console.log("pause");
      wavesurfer.current.pause();
    }
    if (
      props.progress > props.tracksData.clips[0].startPoint &&
      props.isPlaying &&
      wavesurfer.current
    ) {
      console.log("play");
      wavesurfer.current.play(
        props.progress - props.tracksData.clips[0].startPoint,
        props.tracksData.clips[0].startPoint + duration
      );
      console.log(
        "currentTime - startTime",
        props.progress - props.tracksData.clips[0].startPoint
      );
      console.log("duration", props.tracksData.clips[0].startPoint + duration);
    }
  }, [props.isPlaying, props.tracksData.clips[0].startPoint < props.progress]);

  return (
    <div>
      <Clip id="waveform" ref={waveformRef}></Clip>
      <TimelineBlock id="wave-timeline" ref={timelineRef} />
    </div>
  );
};
// });

export default AudioClip;
