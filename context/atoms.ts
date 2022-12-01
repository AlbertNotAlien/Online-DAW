import { Timestamp } from "firebase/firestore";
import { useState, useEffect, useRef, MouseEvent } from "react";
import { atom, selector } from "recoil";

export interface ProjectData {
  id: string;
  name: string;
  tempo: number;
  ownerId: string;
  ownerName: string;
  createdTime: Timestamp | null;
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

export interface ClipData extends MidiData, AudioData {}

export interface TrackData {
  clips: ClipData[];
  id: string;
  isMuted: boolean;
  isSolo: boolean;
  name: string;
  type: string;
  selectedBy: string;
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

// export const projectIdState = atom({
//   key: "projectIdState",
//   default: "",
// });

export interface hoverMidiInfoState {
  notation: string;
  notationIndex: number;
  octaveIndex: number;
}

export type AddFunctionType = (msg: string) => void;

export const projectDataState = atom({
  key: "projectDataState",
  default: {
    createdTime: null,
    id: "",
    name: "",
    ownerId: "",
    ownerName: "",
    tempo: 60,
  } as ProjectData,
});

export const tracksDataState = atom({
  key: "tracksDataState",
  default: [] as TrackData[],
});

export const progressState = atom({
  key: "progressState",
  default: {
    bars: 0,
    quarters: 0,
    sixteenths: 0,
  },
});
export const inputProgressState = atom({
  key: "inputProgressState",
  default: {
    bars: 0,
    quarters: 0,
    sixteenths: 0,
  },
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
  default: null as string | null,
});

export const isPlayingState = atom({
  key: "isPlayingState",
  default: false,
});
export const isPausedState = atom({
  key: "isPausedState",
  default: false,
});
export const isRecordingState = atom({
  key: "isRecordingState",
  default: false,
});
export const isMetronomeState = atom({
  key: "isMetronomeState",
  default: false,
});
export const isLoadingState = atom({
  key: "isLoadingState",
  default: false,
});
export const playerStatusState = atom({
  key: "playerStatusState",
  default: "paused", // "playing/paused/recording"
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
