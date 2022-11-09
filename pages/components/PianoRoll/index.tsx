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

import Draggable from "react-draggable";
import produce from "immer";

const Container = styled.div`
  display: flex;
`;

const PianoRoll = styled.div`
  display: flex;
  flex-direction: column-reverse;
  position: relative;
`;

const NoteRuler = styled.div`
  /* margin: 0px; */
`;

const NoteRulerInfo = styled.p`
  width: 100px;
  margin: 0px;
`;

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
  cursor: grab;

  left: ${(props) =>
    ((props.startBars - 1) * 8 + (props.startBeats - 1) + 1) * 25}px;
  bottom: ${(props) => ((props.octave - 1) * 12 + props.notationIndex) * 10}px;
`;

// startBars={note.start.bars}
// startBeats={note.start.beats}
// lengthBars={note.length.bars}
// lengthBeats={note.length.beats}

interface NoteBarProps {
  notation: string;
  notationIndex: number;
  octave: number;
  startBars: number;
  startBeats: number;
  lengthBars: number;
  lengthBeats: number;
}

interface NoteData {
  notation: string;
  notationIndex: number;
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
    notationIndex: number,
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
        notationIndex: notationIndex,
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

  const handleClipDraggable = (
    event: any,
    dragElement: { x: number; y: number }
    // index: number
  ) => {
    const newPositionX = Math.abs(dragElement.x) < 25 ? 0 : dragElement.x;
    console.log(newPositionX);
    // const currentBar = Math.floor(newPositionX / 25) + 1;
    // setTrackPosition({ x: currentBar, y: 0 });
    // tracksData[index].clips[0].startPoint = convertBarsToTime(currentBar);
  };

  return (
    <Container>
      <NoteRuler>
        <>
          <NoteRulerInfo>{hoverNote}</NoteRulerInfo>
        </>
      </NoteRuler>
      <PianoRoll>
        {midiTracks.map((track: TrackData, index: number) => {
          return (
            <Draggable
              axis="x"
              onStop={(event, dragElement) =>
                handleClipDraggable(event, dragElement)
              }
              grid={[25, 10]}
              defaultPosition={{
                x: 25,
                y: 0,
              }}
              handle="#handle"
              bounds={{ left: 0 }}
              key={track.id}
            >
              <>
                {track.notes?.map((note) => {
                  // console.log(note);
                  return (
                    <NoteBar
                      key={`${note.notation}-${note.octave}-${note.start.bars}-${note.start.beats}-${note.length}`}
                      id="handle"
                      notation={note.notation}
                      notationIndex={note.notationIndex}
                      octave={note.octave}
                      startBars={note.start.bars}
                      startBeats={note.start.beats}
                      lengthBars={note.length.bars}
                      lengthBeats={note.length.beats}
                    />
                  );
                })}
              </>
            </Draggable>
          );
        })}
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
                                notationIndex,
                                octaveIndex + 1,
                                barsIndex * 2 + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation}
                                  octave${octaveIndex + 1}
                                  bars${barsIndex * 2 + 1}
                                  beats${beatsIndex + 1}`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex * 2 + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockWhiteKeyBright
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                (barsIndex + 1) * 2,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${(barsIndex + 1) * 2} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${
                              (barsIndex + 1) * 2
                            }-${beatsIndex + 1}`}
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
                                notationIndex,
                                octaveIndex + 1,
                                barsIndex * 2 + 1,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${barsIndex * 2 + 1} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                                ${notation}-${octaveIndex + 1}-${
                              barsIndex * 2 + 1
                            }-${beatsIndex + 1}`}
                          />
                        ))}
                        {new Array(8).fill(0).map((_, beatsIndex) => (
                          <MidiBlockBlackKeyBright
                            onDoubleClick={() => {
                              handleDoubleMidiBlock(
                                notation,
                                notationIndex,
                                octaveIndex + 1,
                                (barsIndex + 1) * 2,
                                beatsIndex + 1
                              );
                            }}
                            onMouseOver={() => {
                              setHoverNote(
                                `notation${notation} octave${
                                  octaveIndex + 1
                                } bars${(barsIndex + 1) * 2} beats${
                                  beatsIndex + 1
                                }`
                              );
                            }}
                            key={`
                              ${notation}-${octaveIndex + 1}-${
                              (barsIndex + 1) * 2
                            }-${beatsIndex + 1}`}
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
