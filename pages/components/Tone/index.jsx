import { useState, useEffect } from "react";
import * as Tone from "tone";
import { useRecoilState } from "recoil";

import { trackDataState, playingNoteState } from "../../../lib/atoms";

export default function App(props) {
  const [instrument, setInstrument] = useState(null);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);

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

  const playNote = (note, octave, start) => {
    if (instrument) {
      instrument.triggerAttackRelease(`${note}${octave}`, "8n", now);
      console.log(note);
    }
  };

  // useEffect(() => {
  //   if (playingNote) {
  //     playNote(playingNote.notation, playingNote.octave, now);
  //   }
  // }, [playingNote]);

  const playMelody = (note, octave, start) => {
    if (instrument) {
      console.log("playMelody");
      instrument.triggerAttackRelease(
        `${note}${octave}`,
        "8n",
        ((start.bars * 8 + start.beats) * props.projectData.tempo) / 120
      );
      // console.log(
      //   ((start.bars * 8 + start.beats) * props.projectData.tempo) / 120
      // );
    }
  };

  const handlePlayMelody = () => {
    props.trackData.clips[0].notes.forEach((note) => {
      playMelody(note.notation, note.octave, note.start);
    });
  };

  useEffect(() => {
    if (instrument && props.isPlaying) {
      handlePlayMelody();
    }
  }, [instrument, props.isPlaying]);

  return <></>;
}
