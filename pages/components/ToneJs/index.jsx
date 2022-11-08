import { useState, useEffect } from "react";
import * as Tone from "tone";

export default function App(props) {
  const [instrument, setInstrument] = useState(null);
  const now = Tone.now();
  // const [clock, setClock] = useState(0);

  // useEffect(() => {
  //   console.log("clock test");
  //   const clock = new Tone.Clock((time) => {
  //     console.log(time);
  //   }, 1);
  //   setClock(clock);
  //   console.log(clock);
  //   clock.start();
  // }, []);

  // cause Tone.js can't run in SSR
  useEffect(() => {
    // Tone.Transport.bpm.value = 150;
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    setInstrument(newSynth);
    // console.log("newSynth");
  }, []);

  const playNote = (note, octave, startTime) => {
    if (instrument) {
      instrument.triggerAttackRelease(`${note}${octave}`, "8n", startTime);
      console.log(note);
    }
  };

  const playMelody = (note, octave, startTime) => {
    if (instrument) {
      instrument.triggerAttackRelease(
        `${note}${octave}`,
        "8n",
        (startTime * props.projectData.tempo) / 120
      );
      // console.log((startTime * props.projectData.tempo) / 120);
    }
  };

  const handlePlayMelody = () => {
    // console.log("handlePlayMelody");
    // console.log(props.tracksData.map((clip) => clip));
    const melody = props.tracksData
      .map((clip) => clip)
      .filter((clip) => {
        return clip.type === "midi";
      });
    // console.log(melody[0].clips[0].melody);
    melody[0].clips[0].melody.forEach((data) => {
      playMelody(data.note, data.octave, data.startTime);
    });
  };

  useEffect(() => {
    // console.log("props.isPlaying", props.isPlaying);
    if (instrument && props.isPlaying) {
      handlePlayMelody();
      // console.log("useEffect2");
    }
  }, [instrument, props.isPlaying]);

  return (
    <div className="App">
      <div className="note-wrapper">
        <button className="note" onClick={() => playNote("C", 4, 0)}>
          C
        </button>
        <button className="note" onClick={() => playNote("D", 4, "4n")}>
          D
        </button>
        <button className="note" onClick={() => playNote("E", 4, 0)}>
          E
        </button>
        <button className="note" onClick={() => playNote("G", 4, 0)}>
          G
        </button>
        <button className="note" onClick={() => playNote("A", 4, 0)}>
          A
        </button>
      </div>
    </div>
  );
}
