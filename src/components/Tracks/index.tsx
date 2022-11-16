import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable from "react-draggable";
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
  TrackData,
  NoteData,
} from "../../../lib/atoms";
import Measures from "./Measures";
import WaveSurfer from "./WaveSurfer";
import MidiBar from "./MidiBar";

interface ProgresslineProps {
  progressLinePosition: number;
}

interface ProjectData {
  trackHeight: number;
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
}

interface IsSoloButtonProps {
  isSolo: string;
}

interface IsMutedButtonProps {
  isMuted: string;
}

interface TrackControlsProps {
  trackHeight: number;
  selectedColor: string;
}

const Progressline = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: darkcyan;
  height: 100%;
  position: absolute;
  left: ${(props) => props.progressLinePosition}px;
  margin-left: 200px;
`;

const Controls = styled.div`
  margin: 20px 0px;
  display: flex;
  column-gap: 15px;
`;

const TrackLine = styled.div`
  display: flex;
  width: 100%;
  margin-bottom: 10px;
`;

const TrackControls = styled.div<TrackControlsProps>`
  position: absolute;
  width: 200px;
  height: ${(props) => props.trackHeight}px;
  background-color: ${(props) => props.selectedColor};
  /* display: flex; */
  align-items: center;
  padding-left: 10px;
`;

const TrackTitle = styled.p`
  font-size: 15px;
`;

const TrackButtons = styled.div`
  display: flex;
`;

const TrackButton = styled.button`
  height: 20px;
  border: none;
  border-radius: 5px;
`;

const IsSoloButton = styled(TrackButton)<IsSoloButtonProps>`
  background-color: ${(props) => props.isSolo};
`;

const IsMutedButton = styled(TrackButton)<IsMutedButtonProps>`
  background-color: ${(props) => props.isMuted};
`;

const Track = styled.div`
  margin-left: 200px;
  position: relative;
`;

const ClipTitle = styled.div`
  height: 20px;
  width: 100%;
  padding-left: 10px;
  background-color: darkcyan;

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Tracks = (props: any) => {
  const projectData = useRecoilValue(projectDataState);

  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);

  const projectId = "5BbhQTKKkFcM9nCjMG3I";
  const barWidthCoefficient = projectData.barWidthCoefficient; // 一個bar長 9.5px/58bpm
  const barWidth = (120 / projectData.tempo) * barWidthCoefficient;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });

  // const secondsRef = useRef<number>(0);
  // const intervalRef = useRef<any>(null);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );

  const handleTrackMute = async (isMuted: boolean, trackId: string) => {
    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        isMuted: isMuted,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  const handleTrackSolo = async (isSolo: boolean, trackId: string) => {
    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        isSolo: isSolo,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  const handleProgressLine = (e: MouseEvent<HTMLDivElement>) => {
    const clickPosition = e.clientX - 200;
    if (clickPosition > 0) {
      const positionRemainder = clickPosition % barWidth;
      const currentPosition =
        Math.abs(clickPosition - positionRemainder) < barWidth // 第1小節
          ? 0
          : clickPosition - positionRemainder;
      const currentBar = currentPosition / barWidth;
      setProgress(props.convertBeatsToMs(currentBar + 1));
    }
  };

  const handleSelectTrack = (trackId: string, trackIndex: number) => {
    if (tracksData) {
      setTracksdata(
        produce(tracksData, (draft) => {
          draft[trackIndex].isSelected = true;
        })
      );
      setSelectedTrackId(trackId);
      setSelectedTrackIndex(trackIndex);
    }
  };

  const handleClipDraggable = (
    event: any,
    dragElement: { x: number; y: number },
    index: number
  ) => {
    const positionX = Math.abs(dragElement.x) < barWidth ? 0 : dragElement.x;
    const currentBar = Math.floor(positionX / barWidth) + 1;
    if (tracksData && tracksData[index].clips) {
      setTrackPosition({ x: currentBar, y: 0 });
      setTracksdata(
        produce(tracksData, (draft) => {
          draft[index].clips[0].startPoint.bars =
            props.convertBeatsToMs(currentBar);
        })
      );
    }
  };

  const [instrument, setInstrument] = useState<any>(null);
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);

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

  const handlePlayMidi = (note: NoteData) => {
    console.log("handlePlayMidi");
    if (instrument) {
      Tone.Transport.schedule(function (time) {
        console.log("getSecondsAtTime", Tone.Transport.getSecondsAtTime(time));
        console.log("position", Tone.Transport.position);

        instrument.triggerAttackRelease(
          `${note.notation}${note.octave}`,
          `${note.length.bars}:${note.length.quarters}:${note.length.sixteenths}`
        );
      }, `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`);
    }
  };

  const handlePlayAudio = (url: string) => {
    Tone.Transport.position = "1:1:1";
    const player = new Tone.Player(url).toDestination();
    Tone.loaded().then(() => {
      player.sync().start("1:1:1");
    });
  };

  useEffect(() => {
    Tone.Transport.bpm.value = 58; //////////////////////////////////////////////////////////
    if (instrument && props.isPlaying) {
      const timer = setInterval(() => console.log(Tone.now()), 100);
      // console.log(Tone);
      const startPlaying = async () => {
        Tone.Transport.stop();
        Tone.Transport.position = 0;
        Tone.Transport.cancel();

        tracksData
          ?.filter((track) => track.type === "midi")
          .forEach((track) =>
            track.clips[0].notes.forEach((note: NoteData, index: number) => {
              handlePlayMidi(note);
            })
          );

        tracksData
          ?.filter((track) => track.type === "audio")
          .forEach((track) => handlePlayAudio(track.clips[0].url));

        // metronome
        // const synth = new Tone.Synth().toDestination();
        // Tone.Transport.scheduleRepeat((time) => {
        //   synth.triggerAttackRelease("C5", "16n");
        // }, "4n");

        Tone.Transport.start();

        await Tone.start(); /////////////////////////////////
      };
      startPlaying();
      return () => clearInterval(timer);
    } else if (instrument && !props.isPlaying) {
      console.log("Tone.Transport.pause()");
      Tone.Transport.pause();
    }
  }, [instrument, props.isPlaying]);

  const exportAudio = () => {
    const audio = document.querySelector("audio");
    const synth = new Tone.Synth();
    const audioContext = Tone.context;
    const dest = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);

    synth.connect(dest);
    synth.toDestination();

    console.log(tracksData[3].clips[0].url);

    const url1: string = tracksData[3].clips[0].url;
    const player = new Tone.Player(url1).toDestination();
    player.connect(dest);
    Tone.loaded().then(() => {
      player.start();
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
      <audio controls></audio>
      <button onClick={exportAudio}>export</button>
      {tracksData &&
        tracksData.length > 0 &&
        tracksData.map((track, index) => {
          return (
            <TrackLine
              key={`${track.trackName}-${index}`}
              onClick={() => {
                handleSelectTrack(track.id, index);
              }}
            >
              <TrackControls
                selectedColor={
                  selectedTrackId === track.id ? "#2F302F" : "#606060"
                }
                trackHeight={projectData.trackHeight}
              >
                <TrackTitle>{track.trackName}</TrackTitle>
                <TrackButtons>
                  <IsSoloButton
                    onClick={() => {
                      handleTrackSolo(!track.isSolo, track.id);
                    }}
                    isSolo={track.isSolo ? "#2F302F" : "#606060"}
                  >
                    Solo
                  </IsSoloButton>
                  <IsMutedButton
                    onClick={() => {
                      handleTrackMute(!track.isMuted, track.id);
                    }}
                    isMuted={track.isMuted ? "#2F302F" : "#606060"}
                  >
                    Mute
                  </IsMutedButton>
                </TrackButtons>
              </TrackControls>
              <Track>
                {track.type === "audio" ? (
                  <Draggable
                    axis="x"
                    onStop={(event, dragElement) =>
                      handleClipDraggable(event, dragElement, index)
                    }
                    grid={[barWidth, 0]}
                    defaultPosition={{
                      x:
                        props.convertBeatsToMs(
                          (tracksData[index]?.clips[0].startPoint.bars - 1) *
                            8 +
                            (tracksData[index]?.clips[0].startPoint.quarters -
                              1)
                        ) * barWidth,
                      y: 0,
                    }}
                    handle="#handle"
                    bounds={{ left: 0 }}
                  >
                    <>
                      <ClipTitle id="handle">
                        {track.clips[0].clipName}
                      </ClipTitle>
                      <WaveSurfer
                        key={index}
                        index={index}
                        projectData={projectData}
                        trackData={tracksData[index]}
                        convertMsToBeats={props.convertMsToBeats}
                        convertBeatsToMs={props.convertBeatsToMs}
                        // isPlaying={isPlaying}
                        // progress={progress}
                      />
                    </>
                  </Draggable>
                ) : (
                  <>
                    <ClipTitle />
                    <MidiBar
                      isPlaying={isPlaying}
                      projectData={projectData}
                      trackData={tracksData[index]}
                      barWidth={barWidth}
                      progress={progress}
                    />
                  </>
                )}

                <Measures projectData={projectData} />
              </Track>
            </TrackLine>
          );
        })}
    </>
  );
};

export default Tracks;
