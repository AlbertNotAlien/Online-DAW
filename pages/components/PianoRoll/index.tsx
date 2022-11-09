import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../../../config/firebase";

const Container = styled.div`
  display: flex;
`;

const PianoRoll = styled.div`
  display: flex;
  flex-direction: column-reverse;
`;

const NoteRuler = styled.div``;

const NoteRulerInfo = styled.p``;

const PianoKey = styled.button`
  width: 25px;
  height: 10px;
  border: none;
  border-bottom: 1px solid gray;
  border-right: 1px solid black;
  /* &:hover {
    filter: brightness(120%);
  } */
`;

const MidiKeys = styled.div`
  display: flex;
`;

const WhiteKeys = styled(MidiKeys)`
  /* & + & {
    border-bottom: red;
  } */
`;

const BlackKeys = styled(MidiKeys)``;

const PianoWhiteKey = styled(PianoKey)`
  background-color: white;
  /* & + & {
    border-bottom: red;
  } */
`;

const PianoBlackKey = styled(PianoKey)`
  background-color: black;
`;

const MidiColumn = styled.div`
  display: flex;
  flex-direction: column-reverse;
`;

const MidiBlock = styled.div`
  width: 25px;
  height: 10px;
  border-right: 1px solid gray;
  background-color: darkcyan;
  &:hover {
    filter: brightness(120%);
  }
`;

// const MidiBlockRowEnd = styled.div`
//   &:last-child {
//     border-right: 1px solid blue;
//   }
// `;

const MidiBlockWhiteKeyBright = styled(MidiBlock)`
  background-color: #a5a5a5;
`;

const MidiBlockBlackKeyBright = styled(MidiBlock)`
  background-color: #969696;
`;

const MidiBlockWhiteKeyDark = styled(MidiBlock)`
  background-color: #9f9f9f;
`;

const MidiBlockBlackKeyDark = styled(MidiBlock)`
  background-color: #8f8f8f;
`;

const NoteBar = styled(MidiBlock)<NoteBarProps>`
  background-color: red;
  position: absolute;
`;

interface NoteBarProps {
  notation: string;
  octave: number;
  startBars: number;
  startBeats: number;
  lengthBars: number;
  lengthBeats: number;
}

interface NoteData {
  notation: string;
  octave: number;
  start: {
    bars: number;
    beats: number;
  };
  length: {
    bars: number;
    beats: number;
  };
}

interface TrackData {
  clips: object[];
  id: string;
  isMuted: boolean;
  isSolo: false;
  notes: NoteData[];
  trackName: string;
  type: string;
}

export default function App(props: any) {
  const OCTAVES: number = 6;
  const MUISCALSCALE: string[] = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const DOUBLE_MEASURES: number = 4;
  // const BEATS: number = 4;

  const [hoverNote, setHoverNote] = useState("G5");

  const midiTracks: TrackData[] = props.tracksData
    .map((track: TrackData) => track)
    .filter((track: TrackData) => {
      return track.type === "midi";
    });

  const handleDoubleMidiBlock = async (
    notation: string,
    octave: number,
    startBars: number,
    startBeats: number
  ) => {
    try {
      const trackRef = doc(
        db,
        "projects",
        props.projectId,
        "tracks",
        props.trackId
      );
      const newData = {
        notation: notation,
        octave: octave,
        start: {
          bars: startBars,
          beats: startBeats,
        },
        length: {
          bars: 0,
          beats: 1,
        },
      };
      await updateDoc(trackRef, { notes: arrayUnion(newData) });
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <Container>
      <NoteRuler>
        <>
          <NoteRulerInfo>{hoverNote}</NoteRulerInfo>
          {midiTracks.map((track: TrackData, index: number) => {
            return (
              <div key={track.id}>
                {track.notes?.map((note) => {
                  console.log(note);
                  return (
                    <NoteBar
                      notation={note.notation}
                      octave={note.octave}
                      startBars={note.start.bars}
                      startBeats={note.start.beats}
                      lengthBars={note.length.bars}
                      lengthBeats={note.length.beats}
                      key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.beats}-${note.length}`}
                    />
                  );
                })}
              </div>
            );
          })}
        </>
      </NoteRuler>
      <PianoRoll>
        {new Array(OCTAVES).fill(0).map((_, octaveIndex) => (
          <MidiColumn key={octaveIndex}>
            {MUISCALSCALE.map((notation, notationIndex) => (
              <div
                key={`${notation}-${notationIndex}`}
                onMouseLeave={() => {
                  setHoverNote("");
                }}
              >
                {notation.length === 1 ? (
                  <WhiteKeys>
                    <PianoWhiteKey onClick={() => {}} />
                    {new Array(DOUBLE_MEASURES).fill(0).map((_, barsIndex) => (
                      <>
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockWhiteKeyDark
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                octaveIndex + 1,
                                barsIndex + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex + 1} beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockWhiteKeyBright
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                octaveIndex + 1,
                                barsIndex + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex + 1} beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${barsIndex + 1}-${
                              beatsIndex + 1
                            }`}
                          />
                        ))}
                      </>
                    ))}
                  </WhiteKeys>
                ) : (
                  <BlackKeys>
                    <PianoBlackKey onClick={() => {}} />
                    {new Array(DOUBLE_MEASURES).fill(0).map((_, barsIndex) => (
                      <>
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockBlackKeyDark
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                octaveIndex + 1,
                                barsIndex + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex + 1} beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockBlackKeyBright
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                octaveIndex + 1,
                                barsIndex + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex + 1} beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${barsIndex + 1}-${
                              beatsIndex + 1
                            }`}
                          />
                        ))}
                      </>
                    ))}
                  </BlackKeys>
                )}
              </div>
            ))}
          </MidiColumn>
        ))}
      </PianoRoll>
    </Container>
  );
}
