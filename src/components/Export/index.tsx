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
import { db } from "../../lib/firebase";
import { storage } from "../../lib/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import {
  tracksDataState,
  projectDataState,
  playingNoteState,
  selectedTrackIdState,
  selectedTrackIndexState,
  isPlayingState,
  isMetronomeState,
  barWidthState,
  progressState,
  playerStatusState,
  isLoadingState,
  TrackData,
  NoteData,
  AudioData,
} from "../../lib/atoms";
import { buffer } from "stream/consumers";

const ExportButton = styled.a`
  color: black;
  cursor: pointer;
`;

const Export = (props: any) => {
  const projectData = useRecoilValue(projectDataState);
  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isMetronome, setIsMetronome] = useRecoilState(isMetronomeState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const wavesurfer = useRef(null);
  const [duration, setDuration] = useState(0);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useRecoilState(progressState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);

  const [volume, setVolume] = useState<Tone.Volume>();

  // const getInstrument = () => {
  //   const vol = new Tone.Volume(-50).toDestination();
  //   const newSynth = new Tone.Synth().connect(vol).toDestination();
  //   return newSynth;
  // };

  // const [instrument, setInstrument] = useState<Tone.Synth>(() => {
  //   // const vol = new Tone.Volume(-50).toDestination();
  //   // const newSynth = new Tone.Synth().connect(vol).toDestination();
  //   // return newSynth;
  //   const initialState = getInstrument();
  //   return initialState;
  // });

  const [instrument, setInstrument] = useState<Tone.Synth>();

  useEffect(() => {
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    setInstrument(newSynth);
    Tone.Transport.bpm.value = 58; //////////////////////////////////////////////////////////
  }, []);

  const getAudioEnd = (track: TrackData) => {
    return new Promise((resolve, reject) => {
      if (track.type === "audio") {
        const startPoint = track.clips[0].startPoint;
        const startTime =
          startPoint.bars * 16 +
          startPoint.quarters * 4 +
          startPoint.sixteenths;

        const getBuffer = (url: string, fn: Function) => {
          const buffer: any = new Tone.Buffer(url, function () {
            const buff = buffer.get();
            fn(buff);
          });
        };

        getBuffer(track.clips[0].url, function (buff: any) {
          const duration = Tone.Time(buff.duration).toBarsBeatsSixteenths();
          resolve(duration);
        });

        // getBuffer.then((data) => console.log(data));
      }
    });
  };

  const getMidiEnd = (track: TrackData) => {
    console.log(track.type);
    if (track.type === "midi") {
      const startPoint = track.clips[0].startPoint;
      console.log("startPoint", startPoint);
      console.log("notes", track.clips[0].notes);
      const startPoiSixteenths =
        startPoint.bars * 16 + startPoint.quarters * 4 + startPoint.sixteenths;
      // const durationTime =
      const sixteenthsArr = track.clips[0].notes.map((note, index) => {
        console.log(note);
        const sumSixteenths =
          (note.start.bars + note.length.bars) * 16 +
          (note.start.quarters + note.length.quarters) * 4 +
          (note.start.sixteenths + note.length.sixteenths) * 1;
        // console.log(sumSixteenths);
        return sumSixteenths;
      });
      const maxLengthSixteenths = Math.max(...sixteenthsArr);
      console.log(maxLengthSixteenths);
      const EndPointSixteenths = startPoiSixteenths + maxLengthSixteenths;
      const EndPoint = {
        bars: Math.floor(EndPointSixteenths / 16),
        quarters: Math.floor(EndPointSixteenths / 4),
        sixteenths: EndPointSixteenths % 4,
      };
      console.log("EndPoint", EndPoint);
    }
  };

  const handlePlayMidi = (
    note: NoteData,
    dest: MediaStreamAudioDestinationNode
  ) => {
    console.log("handlePlayMidi");
    if (instrument) {
      instrument.connect(dest);
      console.log(note.start);
      console.log(Tone.Transport.position);
      Tone.Transport.schedule(function (time) {
        instrument.triggerAttackRelease(
          `${note.notation}${note.octave}`,
          `${note.length.bars}:${note.length.quarters}:${note.length.sixteenths}`
        );
      }, `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`);
    }
  };

  const handlePlayAudio = (
    clip: AudioData,
    dest: MediaStreamAudioDestinationNode
  ) => {
    console.log("handlePlayAudio");
    const player = new Tone.Player(clip.url).toDestination();
    player.connect(dest);
    Tone.Transport.schedule(function (time) {
      player.sync().start();
    }, `${clip.startPoint.bars}:${clip.startPoint.quarters}:${clip.startPoint.sixteenths}`);
  };

  const exportAudio = () => {
    setPlayerStatus("exporting");

    const audioContext = Tone.context;
    const dest = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);

    const startPlaying = async () => {
      const exportStartPoint = {
        bars: 0,
        quarters: 0,
        sixteenths: 0,
      };
      Tone.Transport.position = `${exportStartPoint.bars}:${exportStartPoint.quarters}:${exportStartPoint.sixteenths}`;

      setIsLoading(true);

      tracksData
        ?.filter((track) => track.type === "midi")
        .forEach((track) =>
          track.clips[0].notes.forEach((note: NoteData) => {
            handlePlayMidi(note, dest);
          })
        );

      tracksData
        ?.filter((track) => track.type === "audio")
        .forEach((track) => handlePlayAudio(track.clips[0], dest));

      Tone.loaded()
        .then(() => {
          console.log("start Exporting");
          recorder.start();
          Tone.Transport.start();
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          setIsLoading(false);
        });

      await Tone.start(); /////////////////////////////////
    };

    startPlaying();

    const exportEndPoint = {
      bars: 1,
      quarters: 0,
      sixteenths: 0,
    };

    // console.log(recorder.state);

    Tone.Transport.schedule(function (time) {
      if (recorder.state === "recording") {
        console.log("stop exporting");
        recorder.stop();
        Tone.Transport.stop();
        setPlayerStatus("paused");
        setIsExporting(false);

        const chunks: any[] = [];
        recorder.ondataavailable = (event) => chunks.push(event.data);
        recorder.onstop = (event) => {
          const blob = new Blob(chunks, { type: "audio/mp3" });
          const blobUrl = window.URL.createObjectURL(blob);
          console.log(blob);
          // window.open(blobUrl);

          const tempLink = document.createElement("a");
          tempLink.href = blobUrl;
          tempLink.setAttribute("download", "filename.mp3");
          tempLink.click();
        };
      }
    }, `${exportEndPoint.bars}:${exportEndPoint.quarters}:${exportEndPoint.sixteenths}`);
  };

  useEffect(() => {
    if (instrument && playerStatus === "exporting") {
      const timer = setInterval(() => {
        const transportPosition = Tone.Transport.position
          .toString()
          .split(":")
          .map((element) => Number(element));
        console.log("transportPosition", transportPosition);
        setProgress({
          bars: transportPosition[0],
          quarters: transportPosition[1],
          sixteenths: transportPosition[2],
        });
      }, 100);

      return () => {
        // Tone.Transport.stop();
        // Tone.Transport.cancel();
        clearInterval(timer);
      };
    } else if (instrument && playerStatus === "paused") {
      Tone.Transport.pause();
    }
  }, [instrument, playerStatus, isMetronome]);

  return (
    <>
      {/* <audio controls></audio>
      <button onClick={exportAudio}>export</button> */}
      <ExportButton onClick={exportAudio}>
        <Image src="/export-button.svg" alt={""} width={20} height={20} />
      </ExportButton>
      {isExporting && <p>converting</p>}
    </>
  );
};

export default Export;
