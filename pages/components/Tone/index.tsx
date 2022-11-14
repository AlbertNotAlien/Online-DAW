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
  left: ${(props) => props.barWidth * props.startTime * 0.25}px;
`;

export default function App(props: any) {
  const [instrument, setInstrument] = useState<any>(null);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);

  const now = Tone.now();

  // cause Tone.js can't run in SSR
  useEffect(() => {
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    setInstrument(newSynth);
  }, []);

  const playNote = (notation: string, octave: number) => {
    if (instrument) {
      instrument.triggerAttackRelease(`${notation}${octave}`, "8n", now);
    }
  };

  useEffect(() => {
    if (playingNote) {
      playNote(playingNote.notation, playingNote.octave);
    }
  }, [playingNote]);

  // const playMelody = (
  //   note: string,
  //   octave: number,
  //   start: { bars: number; quarters: number; sixteenths: number },
  //   length: { bars: number; quarters: number; sixteenths: number }
  // ) => {
  //   if (instrument) {
  //     console.log("playMelody");
  //     instrument.triggerAttackRelease(
  //       `${note}${octave}`,
  //       `${start.bars * 16}+ ${start.quarters * 4} + ${start.sixteenths * 1}`,
  //       now +
  //         (((start.bars - 1) * 16 +
  //           (start.quarters - 1) * 4 +
  //           (start.sixteenths - 1)) *
  //           props.projectData.tempo) /
  //           60
  //     );
  //     // console.log(
  //     //   (((start.bars - 1) * 16 +
  //     //     (start.quarters - 1) * 4 +
  //     //     (start.sixteenths - 1)) *
  //     //     props.projectData.tempo) /
  //     //     60
  //     // );
  //   }
  // };

  // const handlePlayMelody = (note: NoteData) => {
  //   Tone.Transport.bpm.value = 200;
  //   if (instrument) {
  //     instrument.triggerAttackRelease(
  //       `${note.notation}${note.octave}`,
  //       `${
  //         (((note.length.bars * 16 +
  //           note.length.quarters * 4 +
  //           note.length.sixteenths * 1) /
  //           4) *
  //           props.projectData.tempo) /
  //         60
  //       }`,
  //       `${
  //         ((((note.start.bars - 1) * 16 +
  //           (note.start.quarters - 1) * 4 +
  //           (note.start.sixteenths - 1) * 1) /
  //           4) *
  //           props.projectData.tempo) /
  //         60
  //       }`
  //     );
  //     Tone.Transport.start();
  //   }
  // };

  const handlePlayMelody = (note: NoteData) => {
    console.log("handlePlayMelody");
    if (instrument) {
      Tone.Transport.schedule(function (time) {
        console.log(Tone.Transport.getSecondsAtTime(time));
        console.log(Tone.Transport.position);

        instrument.triggerAttackRelease(
          `${note.notation}${note.octave}`,
          `${note.length.bars}:${note.length.quarters}:${note.length.sixteenths}`
        );
      }, `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`);
      console.log(
        "note",
        `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`
      );
    }
  };

  useEffect(() => {
    Tone.Transport.bpm.value = 158;
    if (instrument && props.isPlaying) {
      const timer = setInterval(() => console.log(Tone.now()), 100);
      const startPlaying = async () => {
        Tone.Transport.position = 0;
        Tone.Transport.start(0);

        await Tone.start();
      };
      startPlaying();

      console.log("Tone.Transport.start()");
      // Tone.Transport.start(0);
      // console.log(Tone.Transport.position);
      props.trackData.clips[0].notes.forEach(
        (note: NoteData, index: number) => {
          handlePlayMelody(note);
        }
      );
      return () => clearInterval(timer);
    } else if (instrument && !props.isPlaying) {
      console.log("Tone.Transport.pause()");
      Tone.Transport.pause();
      // Tone.stop();
    }
  }, [instrument, props.isPlaying]);

  // console.log(props.trackData.clips[0].notes);

  return (
    <>
      <MidiRegion barWidth={props.barWidth} length={100}>
        {props.trackData.clips[0].notes.map((note: NoteData, index: number) => (
          <MidiNote
            key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.quarters}-${note.start.sixteenths}`}
            startTime={
              (note.start.bars - 1) * 16 +
              (note.start.quarters - 1) * 4 +
              (note.start.sixteenths - 1)
            }
            width={
              (note.length.bars * 16 +
                note.length.quarters * 4 +
                note.length.sixteenths) *
              props.barWidth
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
