import { useState, useEffect, useRef, MouseEvent } from "react";
import { atom, selector } from "recoil";

export interface ProjectData {
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
  trackHeight: number;
}

export interface NoteData {
  length: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  notation: string;
  notationIndex: number;
  octave: number;
  start: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  abc: number;
}

export interface MidiData {
  notes: NoteData[];
  startPoint: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  clipName: string;
}

export interface AudioData {
  clipName: string;
  startPoint: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  url: string;
}

export interface TrackData {
  clips: AudioData[] | MidiData[];
  id: string;
  isMuted: boolean;
  isSelected: boolean;
  isSolo: boolean;
  trackName: string;
  type: string;
}

export interface PlayingNoteData {
  notation: string;
  octave: number;
}

export interface NoteRulerInfo {
  notation: string;
  notationIndex: number;
  octaveIndex: number;
}

export const projectDataState = atom({
  key: "projectDataState",
  default: {
    barWidthCoefficient: 9.5,
    id: "",
    name: "",
    tempo: 60,
    trackHeight: 150,
  } as ProjectData,
});

export const tracksDataState = atom({
  key: "tracksDataState",
  default: null as TrackData[] | null,
});

export const playingNoteState = atom({
  key: "playingNoteState",
  default: null as PlayingNoteData | null,
});

export const hoverMidiInfoState = atom({
  key: "hoverMidiInfoState",
  default: null as NoteRulerInfo | null,
});

export const selectedTrackIndexState = atom({
  key: "selectedTrackIndexState",
  default: null as number | null,
});

export const barWidthState = atom({
  key: "barWidthState",
  default: 0, // *BPM
});

export const selectedTrackIdState = atom({
  key: "selectedTrackIdState",
  default: "",
});

// const uploadTrackData = async (tracksData: boolean, trackId: string) => {
//   try {
//     const trackRef = doc(db, "projects", projectId, "tracks", trackId);
//     const newData = {
//       isMuted: isMuted,
//     };
//     await updateDoc(trackRef, newData);
//     console.log("info updated");
//   } catch (err) {
//     console.log(err);
//   }
// };
