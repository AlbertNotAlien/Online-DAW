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
  }, []);

  // const playNote = (note, octave, start) => {
  //   if (instrument) {
  //     instrument.triggerAttackRelease(`${note}${octave}`, "8n", start);
  //     console.log(note);
  //   }
  // };

  const playMelody = (note, octave, start) => {
    if (instrument) {
      // console.log(start);
      instrument.triggerAttackRelease(
        `${note}${octave}`,
        "8n",
        ((start.bars * 8 + start.beats) * props.projectData.tempo) / 120
      );
      console.log((start * props.projectData.tempo) / 120);
    }
  };

  const handlePlayMelody = () => {
    // console.log("handlePlayMelody");
    // console.log(props.tracksData.map((clip) => clip));
    const midiTracks = props.tracksData
      .map((track) => track)
      .filter((track) => {
        return track.type === "midi";
      });
    // console.log(notes[0].clips[0].notes);
    midiTracks[0].clips[0].notes.forEach((data) => {
      playMelody(data.note, data.octave, data.start);
      // console.log(data);
    });
  };

  useEffect(() => {
    if (instrument && props.isPlaying) {
      handlePlayMelody();
    }
  }, [instrument, props.isPlaying]);

  return (
    <>
      {/* <div className="note-wrapper">
        <button className="note" onClick={() => playNote("A", 4, 0)}>
          A
        </button>
      </div> */}
    </>
  );
}
