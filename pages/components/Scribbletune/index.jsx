import React, { useState, useEffect } from "react";
import { scale, scales, clip } from "scribbletune/browser";
import * as Tone from "tone";

Tone.context.resume().then(() => Tone.Transport.start());

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [root, setRoot] = useState("C");
  const [mode, setMode] = useState(scales()[0]);
  const [theClip, setTheClip] = useState(null);

  const [synth, setSynth] = useState(null);

  useEffect(() => {
    const newSynth = new Tone.Synth().toDestination();
    setSynth(newSynth);
  }, []);

  useEffect(() => {
    if (!theClip) {
      return;
    }
    if (isPlaying) {
      theClip.start();
    } else {
      theClip.stop();
    }
  }, [isPlaying, theClip]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      setTheClip(
        clip({
          pattern: "xxxx", // or just x since we dont have any variation
          sample: "https://scribbletune.com/sounds/kick.wav",
        })
      );
      setIsPlaying(true);
    }
  };

  //   const getScaleOptions = () =>
  //     scales().map((s, index) => <option key={index}>{s}</option>);

  //   const getRootOptions = () =>
  //     "C,Db,D,Eb,E,F,Gb,G,Ab,A,Bb,B"
  //       .split(",")
  //       .map((s, index) => <option key={index}>{s}</option>);

  //   const onScaleChange = (e) => {
  //     if (isPlaying) setIsPlaying(false);
  //     setMode(e.target.value);
  //   };

  //   const onRootChange = (e) => {
  //     if (isPlaying) setIsPlaying(false);
  //     setRoot(e.target.value);
  //   };

  return (
    <div>
      <h1>{/* {root} {mode} */}</h1>
      {/* <p>{scale(`${root}4 ${mode}`).join(", ")}</p> */}
      {/* <select onChange={onRootChange}>{getRootOptions()}</select> */}
      {/* <select onChange={onScaleChange}>{getScaleOptions()}</select> */}
      <button onClick={togglePlay}>{isPlaying ? "Stop" : "Start"}</button>
    </div>
  );
}
