import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";

const Clip = styled.div`
  position: relative;
  z-index: 1;
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
  const [duration, setDuration] = useState(0);

  const startPoint = props.trackData.clips[0].startPoint;
  // const startMillisecond = props.convertBeatsToMs(
  //   (startPoint.bars - 1) * 8 + (startPoint.quarters - 1)
  // );

  const clipUrl = props.trackData.clips[0].url;
  // console.log("clipUrl", clipUrl);

  useEffect(() => {
    const create = async () => {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const options: Options = formWaveSurferOptions(waveformRef.current);

      // console.log("props.trackData", props.trackData.clips[0].url);

      wavesurfer.current = WaveSurfer.create(options);
      console.log("wavesurfer", wavesurfer.current);
      wavesurfer.current.load(clipUrl);
    };

    setTimeout(create, 10);

    return () => {
      if (wavesurfer.current) {
        console.log("destroy");
        wavesurfer.current.destroy();
      }
    };
  }, [clipUrl]);

  return (
    <>
      <Clip id="waveform" ref={waveformRef} />
    </>
  );
};

export default WaveSurfer;
