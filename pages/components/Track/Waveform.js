import { useEffect, useRef, useState } from "react";
import styled from "styled-components";

// import TimeLine from "wavesurfer.js/dist/plugins/wavesurfer.timeLine.js";

const Track = styled.div`
  display: flex;
  width: 500px;
`;

// const Controls = styled.div`
//   display: flex;
//   width: 500px;
// `;

const Button = styled.button`
  cursor: pointer;
`;

const Bar = styled.div`
  width: 100px;
  height: 25px;
  background-color: gray;
  border: 1px solid white;
`;

const formWaveSurferOptions = (ref) => ({
  container: "#waveform",
  waveColor: "violet",
  progressColor: "purple",
  maxCanvasWidth: 10000,
  fillParent: true, //////////////////////////////////////////////////////////////////
  // plugins: [
  //   WaveSurfer.timeline.create({
  //     container: "#wave-timeline",
  //   }),
  // ],
});

export default function Waveform() {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const [playing, setPlaying] = useState(false);

  const url = "/audio/20220927_快樂丸.mp3";

  useEffect(() => {
    create();

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, []);

  const create = async () => {
    const WaveSurfer = (await import("wavesurfer.js")).default;

    const options = formWaveSurferOptions(waveformRef.current);
    wavesurfer.current = WaveSurfer.create(options);

    wavesurfer.current.load(url);
    // wavesurfer.current.load(require(url));
  };

  const handlePlayPause = () => {
    setPlaying(!playing);
    wavesurfer.current.playPause();
  };

  return (
    <div>
      <Track>
        <div id="waveform" ref={waveformRef} />
      </Track>
      <Bar />
      <div className="controls">
        <Button onClick={handlePlayPause}>{!playing ? "play" : "pause"}</Button>
      </div>
    </div>
  );
}
