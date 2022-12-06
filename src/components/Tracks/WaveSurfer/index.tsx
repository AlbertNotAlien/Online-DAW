import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Clip = styled.div`
  position: relative;
  z-index: -1;
  pointer-events: none;
`;

interface Options {
  container: any;
  waveColor: string;
  progressColor: string;
  cursorColor: string;
  cursorWidth: number;
  responsive: boolean;
  height: number;
  normalize: boolean;
  partialRender: boolean;
  fillParent: boolean;
  plugins: never[];
  interact: boolean;
  zIndex: number;
}

const formWaveSurferOptions = (waveformRef: any) => ({
  container: waveformRef,
  waveColor: "#eee",
  progressColor: "#eee",
  cursorColor: "OrangeRed",
  cursorWidth: 0,
  responsive: true,
  height: 130,
  normalize: true,
  partialRender: true,
  fillParent: false,
  plugins: [],
  interact: false,
  zIndex: 2,
});

const WaveSurfer = (props: any) => {
  const waveformRef = useRef(null);
  const wavesurfer = useRef<any>(null);

  const clipUrl = props.trackData.clips[0].url;

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const options: Options = formWaveSurferOptions(waveformRef.current);

      wavesurfer.current = WaveSurfer.create(options);

      if (clipUrl) {
        wavesurfer.current.load(clipUrl);
      }
    };

    setTimeout(create, 10);

    return () => {
      if (wavesurfer.current) {
        console.log("destroy");
        wavesurfer.current.destroy();
      }
    };
  }, [clipUrl]);

  return <Clip id="waveform" ref={waveformRef} />;
};

export default WaveSurfer;
