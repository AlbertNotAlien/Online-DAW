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
  const startPoint = props.convertBarsToTime(
    props.tracksData.clips[0].startPoint
  );

  const [isMute, setIsMute] = useState(false);
  const [isSolo, setIsSolo] = useState(false);

  // console.log("startPoint", props.index, startPoint);

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const options = formWaveSurferOptions(waveformRef.current);

      wavesurfer.current = WaveSurfer.create(options);
      if (props.url && props.tracksData.type === "audio") {
        wavesurfer.current.load(props.url);
      }

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
  }, []);

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
      props.progress < startPoint
    ) {
      setTimeout(() => {
        wavesurfer.current.play(0, duration);
      }, (startPoint - props.progress) * 1000);
    } else if (
      wavesurfer.current &&
      !wavesurfer.current.isPlaying() &&
      props.isPlaying &&
      props.progress > startPoint
    ) {
      console.log("play");
      wavesurfer.current.play(
        props.progress - startPoint,
        startPoint + duration
      );
    }
  }, [props.isPlaying, startPoint < props.progress]);

  useEffect(() => {
    if (wavesurfer.current) {
      console.log(props.tracksData.isMuted);
      wavesurfer.current.setMute(props.tracksData.isMuted ? true : false);
    }
  }, [props.tracksData.isMuted]);

  return (
    <>
      <Clip id="waveform" ref={waveformRef} />
    </>
  );
};
// });

export default WaveSurfer;
