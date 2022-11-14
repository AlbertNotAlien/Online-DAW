import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Clip = styled.div`
  position: relative;
  z-index: 100;
`;

const formWaveSurferOptions = (waveformRef) => ({
  container: waveformRef,
  waveColor: "#eee",
  progressColor: "#0178FF",
  cursorColor: "OrangeRed",
  responsive: true,
  height: 130,
  normalize: true,
  partialRender: true,
  fillParent: false,
  plugins: [],
  interact: false,
  zIndex: 2,
});

const WaveSurfer = (props) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [duration, setDuration] = useState(0);

  const startPoint = props.trackData.clips[0].startPoint;
  const startMillisecond = props.convertBeatsToMs(
    (startPoint.bars - 1) * 8 + (startPoint.quarters - 1)
  );

  // console.log(props.trackData.clips[0].startPoint.bars);
  // console.log(props.trackData.clips[0].startPoint.quarters);

  // const [isMute, setIsMute] = useState(false);
  // const [isSolo, setIsSolo] = useState(false);

  // console.log("startPoint", props.index, startPoint);

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const options = formWaveSurferOptions(waveformRef.current);

      // console.log("props.trackData", props.trackData.clips[0].url);

      wavesurfer.current = WaveSurfer.create(options);
      wavesurfer.current.load(props.trackData.clips[0].url);

      wavesurfer.current.on("ready", function () {
        const audioDuration = wavesurfer.current.getDuration();
        setDuration(audioDuration);
      });
    };

    create();

    return () => {
      if (wavesurfer.current) {
        console.log("destroy");
        wavesurfer.current.destroy();
      }
    };
  }, [props.trackData.clips]);

  useEffect(() => {
    if (
      wavesurfer.current &&
      wavesurfer.current.isPlaying() &&
      !props.isPlaying
    ) {
      wavesurfer.current.pause();
    } else if (
      wavesurfer.current &&
      !wavesurfer.current.isPlaying() &&
      props.isPlaying &&
      props.progress < startMillisecond
    ) {
      setTimeout(() => {
        wavesurfer.current.play(0, duration);
      }, (startMillisecond - props.progress) * 1000);
    } else if (
      wavesurfer.current &&
      !wavesurfer.current.isPlaying() &&
      props.isPlaying &&
      props.progress > startMillisecond
    ) {
      // console.log("play");
      wavesurfer.current.play(
        props.progress - startMillisecond,
        startMillisecond + duration
      );
    }
    // console.log("props.trackData", props.trackData.trackName);

    // console.log("props.progress", props.progress);
    // console.log("startMillisecond", startMillisecond);
  }, [
    duration,
    props.isPlaying,
    props.progress,
    props.trackData.trackName,
    startMillisecond,
  ]);
  // }, [props.isPlaying, startMillisecond, props.progress > startMillisecond]);

  useEffect(() => {
    if (wavesurfer.current) {
      console.log(props.trackData.isMuted);
      wavesurfer.current.setMute(props.trackData.isMuted ? true : false);
    }
  }, [props.trackData.isMuted]);

  return (
    <>
      <Clip id="waveform" ref={waveformRef} />
    </>
  );
};

export default WaveSurfer;
