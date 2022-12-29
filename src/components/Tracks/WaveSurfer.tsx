import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { useSetRecoilState } from "recoil";
import { isLoadingState, ProjectData, TrackData } from "../../store/atoms";

import type WaveSurferType from "wavesurfer.js";

const Clip = styled.div`
  position: relative;
  z-index: -1;
  pointer-events: none;
`;

interface Options {
  container: HTMLDivElement;
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

const formWaveSurferOptions = (containerRef: HTMLDivElement) => ({
  container: containerRef,
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

interface WaveSurferCompProps {
  projectData: ProjectData;
  trackData: TrackData;
}

const WaveSurferComp = (props: WaveSurferCompProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurferType>();
  const setIsLoading = useSetRecoilState(isLoadingState);

  const url = props.trackData.clips[0].url;

  useEffect(() => {
    const create = async () => {
      if (!containerRef.current) return;

      setIsLoading(true);
      const WaveSurfer = (await import("wavesurfer.js")).default;
      const options: Options = formWaveSurferOptions(containerRef.current);
      wavesurferRef.current = WaveSurfer.create(options);

      if (url) {
        wavesurferRef.current.load(url);
        wavesurferRef.current.on("loading", (event) => {
          if (event === 100) {
            setIsLoading(false);
          }
        });
      }
    };

    setTimeout(create, 10);

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
    };
  }, [setIsLoading, url]);

  return <Clip id="waveform" ref={containerRef} />;
};

export default WaveSurferComp;
