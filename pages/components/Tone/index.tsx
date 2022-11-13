import { useState, useEffect } from "react";
import * as Tone from "tone";
import styled from "styled-components";
import { useRecoilState } from "recoil";

import {
  tracksDataState,
  playingNoteState,
  NoteData,
} from "../../../lib/atoms";

interface MidiRegionProps {
  barWidth: number;
  length: number;
}

interface MidiNoteProps {
  width: number;
  barWidth: number;
  startTime: number;
  pitch: number;
  trackHeight: number;
}

const MidiRegion = styled.div<MidiRegionProps>`
  width: ${(props) => props.barWidth * props.length}px;
  height: 130px;
  background-color: #ffffff20;
  position: relative;
`;

const MidiNote = styled.div<MidiNoteProps>`
  width: ${(props) => props.width * 0.5}px;
  height: ${(150 - 30) / 72}px;
  background-color: #ffffff;
  border: 1px solid #ffffff;
  position: absolute;
  bottom: ${(props) =>
    (props.pitch * (props.trackHeight - 20)) / (6 * 12 + 1)}px;
  left: ${(props) => props.barWidth * 0.5 * props.startTime}px;
`;

export default function App(props: any) {
  const [instrument, setInstrument] = useState<any>(null);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);

  const now = Tone.now();

  // cause Tone.js can't run in SSR
  useEffect(() => {
    // Tone.Transport.bpm.value = 150;
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    console.log("newSynth", newSynth);
    setInstrument(newSynth);
  }, []);

  const playNote = (
    note: string,
    octave: number,
    start: { bars: number; quarters: number; sixteenths: number }
  ) => {
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

  const playMelody = (
    note: string,
    octave: number,
    start: { bars: number; quarters: number; sixteenths: number },
    length: { bars: number; quarters: number; sixteenths: number }
  ) => {
    if (instrument) {
      console.log("playMelody");
      instrument.triggerAttackRelease(
        `${note}${octave}`,
        `${start.bars * 16}+ ${start.quarters * 4} + ${start.sixteenths * 1}`,
        now +
          (((start.bars - 1) * 16 +
            (start.quarters - 1) * 4 +
            (start.sixteenths - 1)) *
            props.projectData.tempo) /
            60
      );
      console.log(
        (((start.bars - 1) * 16 +
          (start.quarters - 1) * 4 +
          (start.sixteenths - 1)) *
          props.projectData.tempo) /
          60
      );
    }
  };

  const handlePlayMelody = () => {
    console.log(props.trackData);
    props.trackData.clips[0].notes.forEach((note: NoteData) => {
      console.log(note);
      playMelody(note.notation, note.octave, note.start, note.length);
      console.log(
        "note.notation, note.octave, note.start",
        note.notation,
        note.octave,
        note.start
      );
    });
  };

  useEffect(() => {
    if (instrument && props.isPlaying) {
      handlePlayMelody();
    }
  }, [instrument, props.isPlaying]);

  console.log(props.trackData.clips[0].notes);

  return (
    <>
      <MidiRegion barWidth={props.barWidth} length={3}>
        {props.trackData.clips[0].notes.map((note: NoteData, index: number) => (
          <MidiNote
            key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
            startTime={
              (note.start.bars - 1) * 16 +
              (note.start.quarters - 1) * 4 +
              (note.start.sixteenths - 1)
            }
            width={
              (note.length.bars * 8 + note.length.quarters) * props.barWidth
            }
            barWidth={props.barWidth}
            pitch={(note.octave - 1) * 12 + note.notationIndex}
            trackHeight={props.projectData.trackHeight}
          />
        ))}
      </MidiRegion>
    </>
  );
}
