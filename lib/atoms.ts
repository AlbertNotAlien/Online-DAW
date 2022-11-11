import { useState, useEffect, useRef, MouseEvent } from "react";
import { atom, selector } from "recoil";

// import {
//   doc,
//   collection,
//   getDoc,
//   setDoc,
//   updateDoc,
//   onSnapshot,
//   DocumentData,
//   orderBy,
// } from "firebase/firestore";
// import { db } from "../lib/firebase";

export interface MidiData {
  notes: {
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
  }[];
  startPoint: {
    bars: number;
    beats: number;
  };
}

export interface AudioData {
  clipName: string;
  startPoint: {
    bars: number;
    beats: number;
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
  length: {
    bars: number;
    beats: number;
  };
}

export const tracksDataState = atom({
  key: "tracksDataState",
  default: null as TrackData[] | null,
});

export const playingNoteState = atom({
  key: "playingNoteState",
  default: null as PlayingNoteData | null,
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
