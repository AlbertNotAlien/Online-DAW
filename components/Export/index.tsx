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
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
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
  inputProgressState,
  AddFunctionType,
} from "../../context/atoms";
import Modal from "../Modal";
import NotificationHub from "../NotificationHub";

const ExportButton = styled.a`
  color: black;
  width: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translateX(-3px);
`;

const ModalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  width: 300px;
`;

const EndPointTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
`;

const EndPointInputs = styled.div`
  display: flex;
  justify-content: space-between;
  column-gap: 10px;
`;

const EndPointInput = styled.input`
  font-size: 16px;
  text-align: center;
  width: 100%;
  height: 36px;
  border-radius: 10px;
  border: none;
  &:focus {
    outline: none;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  color: white;
  background-color: #323232;
`;

const ModalButtons = styled.div`
  height: 36px;

  display: flex;
  column-gap: 10px;
`;

const ModalButton = styled.button`
  font-size: 16px;
  line-height: 18px;
  width: 50%;
  color: white;
  background-color: #6e6e6e;
  border: none;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  &:hover {
    filter: brightness(110%);
  }
`;

const Export = (props: any) => {
  const projectData = useRecoilValue(projectDataState);
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isMetronome, setIsMetronome] = useRecoilState(isMetronomeState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const wavesurfer = useRef(null);
  const [duration, setDuration] = useState(0);

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useRecoilState(progressState);
  const [inputProgress, setInputProgress] = useRecoilState(inputProgressState);

  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [instrument, setInstrument] = useState<Tone.Synth>();

  useEffect(() => {
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    setInstrument(newSynth);
    Tone.Transport.bpm.value = 58; //////////////////////////////////////////////////////////
  }, []);

  const getAudioEnd = (track: TrackData) => {
    return new Promise((resolve, reject) => {
      if (track.type === "audio" || track.type === "record") {
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

        Tone.loaded().then(() => {
          getBuffer(track.clips[0].url, function (buff: any) {
            const duration = Tone.Time(buff.duration).toBarsBeatsSixteenths();
            resolve(duration);
          });
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
    Tone.loaded().then(() => {
      Tone.Transport.schedule(function (time) {
        player.sync().start();
      }, `${clip.startPoint.bars}:${clip.startPoint.quarters}:${clip.startPoint.sixteenths}`);
    });
  };

  const exportAudio = (
    endBars: number,
    endQuarters: number,
    endSixteenths: number
  ) => {
    setPlayerStatus("exporting");
    const exportStartPoint = {
      bars: 0,
      quarters: 0,
      sixteenths: 0,
    };
    Tone.Transport.position = `${exportStartPoint.bars}:${exportStartPoint.quarters}:${exportStartPoint.sixteenths}`;

    const audioContext = Tone.context;
    const dest = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);

    const startPlaying = async () => {
      setIsLoading(true);

      tracksData
        ?.filter((track) => track.type === "midi")
        .forEach((track) =>
          track.clips[0].notes.forEach((note: NoteData) => {
            handlePlayMidi(note, dest);
          })
        );

      tracksData
        ?.filter((track) => track.type === "audio" || track.type === "record")
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
      bars: endBars,
      quarters: endQuarters,
      sixteenths: endSixteenths,
    };

    // console.log(recorder.state);

    Tone.Transport.schedule(function (time) {
      if (recorder.state === "recording") {
        console.log("stop exporting");
        recorder.stop();
        Tone.Transport.stop();
        setPlayerStatus("paused");
        setIsExporting(false);
      }
    }, `${exportEndPoint.bars}:${exportEndPoint.quarters}:${exportEndPoint.sixteenths}`);

    const chunks: any[] = [];
    recorder.ondataavailable = (event) => chunks.push(event.data);
    recorder.onstop = (event) => {
      // let blob = new Blob(chunks, { type: "audio/wav; codecs=0" });
      let blob = new Blob(chunks, { type: "audio/mp3" });
      const blobUrl = window.URL.createObjectURL(blob);
      console.log(blob);
      // window.open(blobUrl);

      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      // tempLink.setAttribute("download", "請用Chrome開啟.wav");
      tempLink.setAttribute("download", `${projectData.name}.mp3`);
      tempLink.click();
    };
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
        setInputProgress({
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

  const endBarsRef = useRef<HTMLInputElement | null>(null);
  const endQuartersRef = useRef<HTMLInputElement | null>(null);
  const endSixteenthsRef = useRef<HTMLInputElement | null>(null);

  const notificationRef = useRef<null | AddFunctionType>(null);

  const handleConfirmError = (message: string) => {
    notificationRef.current?.(message);
  };

  return (
    <>
      <NotificationHub
        notificationChildren={(add: AddFunctionType) => {
          notificationRef.current = add;
        }}
      />
      {isModalOpen && (
        <Modal setIsModalOpen={setIsModalOpen}>
          <ModalWrapper>
            <EndPointTitle>Export Range</EndPointTitle>
            <EndPointInputs>
              <EndPointInput
                type="number"
                placeholder="bars"
                min={1}
                max={300}
                defaultValue={2}
                required
                ref={endBarsRef}
              />
              <EndPointInput
                type="number"
                placeholder="quarters"
                min={1}
                max={4}
                defaultValue={1}
                required
                ref={endQuartersRef}
              />
              <EndPointInput
                type="number"
                placeholder="sixteenths"
                min={1}
                max={4}
                defaultValue={1}
                required
                ref={endSixteenthsRef}
              />
            </EndPointInputs>
            <div>
              <ModalButtons>
                <ModalButton
                  onClick={() => {
                    const regex = /^[0-9\s]*$/;
                    if (
                      endBarsRef.current &&
                      endQuartersRef.current &&
                      endSixteenthsRef.current &&
                      !regex.test(endBarsRef.current.value) &&
                      !regex.test(endQuartersRef.current.value) &&
                      !regex.test(endSixteenthsRef.current.value)
                    ) {
                      handleConfirmError("請輸入正確的數值");
                    } else if (
                      (endBarsRef.current &&
                        Number(endBarsRef.current.value) < 1) ||
                      (endQuartersRef.current &&
                        Number(endQuartersRef.current.value) < 1) ||
                      (endSixteenthsRef.current &&
                        Number(endSixteenthsRef.current.value) < 1)
                    ) {
                      handleConfirmError("輸入值不得小於 1");
                    } else if (
                      endBarsRef.current &&
                      endQuartersRef.current &&
                      endSixteenthsRef.current &&
                      endBarsRef.current.value === "1" &&
                      endQuartersRef.current.value === "1" &&
                      endSixteenthsRef.current.value === "1"
                    ) {
                      console.log("alert");
                      handleConfirmError("輸入值不得皆為 1");
                    } else if (
                      endBarsRef.current !== null &&
                      endQuartersRef.current !== null &&
                      endSixteenthsRef.current !== null
                    ) {
                      console.log(endBarsRef.current.value);
                      exportAudio(
                        Math.floor(Number(endBarsRef.current.value) - 1),
                        Math.floor(Number(endQuartersRef.current.value) - 1),
                        Math.floor(Number(endSixteenthsRef.current.value) - 1)
                      );
                      setIsModalOpen(false);
                    }
                  }}
                >
                  Confirm
                </ModalButton>
                <ModalButton
                  onClick={() => {
                    endBarsRef.current = null;
                    endQuartersRef.current = null;
                    endSixteenthsRef.current = null;
                    setIsModalOpen(false);
                  }}
                >
                  Cancel
                </ModalButton>
              </ModalButtons>
            </div>
          </ModalWrapper>
        </Modal>
      )}
      <ExportButton
        onClick={() => {
          setIsModalOpen(true);
          // exportAudio();
        }}
      >
        <Image src="/export-button.svg" alt={""} width={24} height={24} />
      </ExportButton>
      {isExporting && <p>converting</p>}
    </>
  );
};

export default Export;
