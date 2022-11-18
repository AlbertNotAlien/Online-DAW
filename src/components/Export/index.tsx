import Image from "next/image";

import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import produce from "immer";
import * as Tone from "tone";

import {
  doc,
  collection,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  DocumentData,
  orderBy,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { storage } from "../../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  tracksDataState,
  projectDataState,
  playingNoteState,
  selectedTrackIdState,
  selectedTrackIndexState,
  barWidthState,
  progressState,
  TrackData,
  NoteData,
} from "../../../lib/atoms";

const ExportButton = styled.a`
  color: black;
  cursor: pointer;
`;

const Export = (props: any) => {
  const projectData = useRecoilValue(projectDataState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const [isExporting, setIsExporting] = useState(false);

  const exportAudio = () => {
    const audio = document.querySelector("audio");
    const synth = new Tone.Synth();
    const audioContext = Tone.context;
    const dest = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);

    synth.connect(dest);
    synth.toDestination();

    const url1: string = tracksData[3].clips[0].url;
    const player = new Tone.Player(url1).toDestination();
    player.connect(dest);
    Tone.loaded().then(() => {
      player.start();
      setIsExporting(true);
    });

    const chunks: any[] = [];

    const notes = "CDEFGAB".split("").map((notation) => `${notation}4`);
    let note = 0;
    Tone.Transport.scheduleRepeat((time) => {
      if (note === 0) recorder.start();
      if (note > notes.length) {
        synth.triggerRelease(time);
        recorder.stop();
        Tone.Transport.stop();
        player.stop();
        setIsExporting(false);
      } else synth.triggerAttack(notes[note], time);
      note++;
    }, "4n");

    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = (event) => {
      let blob = new Blob(chunks, { type: "audio/mp3" });
      console.log(URL.createObjectURL(blob));
      if (audio) {
        audio.src = URL.createObjectURL(blob);
      }
    };

    Tone.Transport.start();
  };

  return (
    <>
      <ExportButton onClick={exportAudio}>
        <Image src="/export-button.svg" alt={""} width={20} height={20} />
      </ExportButton>
      {isExporting && <p>converting</p>}
    </>
  );
};

export default Export;
