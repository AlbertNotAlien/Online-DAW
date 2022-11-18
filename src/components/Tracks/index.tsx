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
  barWidthState,
  progressState,
  isMetronomeState,
  TrackData,
  NoteData,
} from "../../lib/atoms";
import Measures from "./Measures";
import WaveSurfer from "./WaveSurfer";
import MidiBar from "./MidiBar";
import { style } from "wavesurfer.js/src/util";

interface ProjectData {
  trackHeight: number;
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
}

interface IsSoloButtonProps {
  isSolo: boolean;
}

interface IsMutedButtonProps {
  isMuted: boolean;
}

interface TrackLineProps {
  trackHeight: number;
  selectedColor: string;
}

interface ProgresslineProps {
  progress: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  barWidth: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  height: 100%;
`;

const TimeRuler = styled.div`
  height: 30px;
  width: 100%;
  border-radius: 10px;
  background-color: gray;
  display: flex;
  align-items: center;
  padding-left: 10px;
  font-size: 20px;
  line-height: 20px;
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: scroll;
`;

const ProgressLine = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: #c08a1e;
  /* height: 100%; */
  height: calc(100vh - 50px - 200px - 87px);
  /* height: 500px; */
  position: absolute;
  left: ${(props) =>
    props.progress.bars * props.barWidth +
    (props.progress.quarters * props.barWidth) / 4 +
    (props.progress.sixteenths * props.barWidth) / 16}px;
  margin-left: 420px;
  z-index: 100;
`;

const Track = styled.div<TrackLineProps>`
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  border-radius: 10px;
  height: ${(props) => props.trackHeight}px;
  background-color: ${(props) => props.selectedColor};
`;

const TrackControls = styled.div`
  min-width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  padding-left: 20px;
  row-gap: 10px;
`;

const TrackTitle = styled.p`
  font-size: 15px;
`;

const TrackButtons = styled.div`
  display: flex;
  column-gap: 10px;
`;

const TrackButton = styled.button`
  height: 20px;
  border: none;
  border-radius: 5px;
`;

const IsSoloButton = styled(TrackButton)<IsSoloButtonProps>`
  background-color: ${(props) => (props.isSolo ? "#2F302F" : "#7c7c7c")};
`;

const IsMutedButton = styled(TrackButton)<IsMutedButtonProps>`
  background-color: ${(props) => (props.isMuted ? "#2F302F" : "#7c7c7c")};
`;

const Clip = styled.div`
  /* margin-left: 200px; */
  position: relative;
`;

const ClipTitle = styled.div`
  height: 20px;
  width: 100%;
  line-height: 20px;
  font-size: 10px;
  padding-left: 10px;
  background-color: hsl(0, 0%, 20%);
  z-index: 1;
  position: relative;

  cursor: move; /* fallback if grab cursor is unsupported */
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;

const Tracks = (props: any) => {
  const projectData = useRecoilValue(projectDataState);

  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const barWidth = useRecoilValue(barWidthState);

  const projectId = "5BbhQTKKkFcM9nCjMG3I";

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useRecoilState(progressState);

  console.log(progress);

  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });

  // const secondsRef = useRef<number>(0);
  // const intervalRef = useRef<any>(null);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );

  const isMetronome = useRecoilValue(isMetronomeState);

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
    console.log("dragElement", dragElement.x, dragElement.y);
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
    const player = new Tone.Player(url).toDestination();
    Tone.loaded().then(() => {
      player.sync().start();
    });
  };

  // useEffect(() => {
  //   Tone.Transport.position = `${progress.bars - 1}:${progress.quarters - 1}:${
  //     progress.sixteenths - 1
  //   }`;
  // }, [progress]);

  useEffect(() => {
    Tone.Transport.bpm.value = 58; //////////////////////////////////////////////////////////
    if (instrument && props.isPlaying) {
      const timer = setInterval(() => {
        // console.log(Tone.now());
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
      const startPlaying = async () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        // Tone.Transport.position = `${progress.bars - 1}:${
        //   progress.quarters - 1
        // }:${progress.sixteenths - 1}`;
        console.log("Tone.Transport.position", Tone.Transport.position);

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

        // if (isMetronome) {
        //   const synth = new Tone.Synth().toDestination();
        //   Tone.Transport.scheduleRepeat((time) => {
        //     synth.triggerAttackRelease("C6", 0.01);
        //   }, "4n");
        // }

        Tone.Transport.start();

        // console.log(Tone.TransportTime);

        await Tone.start(); /////////////////////////////////
      };
      startPlaying();
      return () => clearInterval(timer);
    } else if (instrument && !props.isPlaying) {
      console.log("Tone.Transport.pause()");
      Tone.Transport.pause();
    }
  }, [instrument, props.isPlaying, isMetronome]);

  useEffect(() => {
    if (props.isPlaying && isMetronome) {
      const synth = new Tone.Synth().toDestination();
      Tone.Transport.scheduleRepeat((time) => {
        synth.triggerAttackRelease("C6", 0.01);
      }, "4n");
    }
  }, [props.isPlaying, isMetronome]);

  // const exportAudio = () => {
  //   const audio = document.querySelector("audio");
  //   const synth = new Tone.Synth();
  //   const audioContext = Tone.context;
  //   const dest = audioContext.createMediaStreamDestination();
  //   const recorder = new MediaRecorder(dest.stream);

  //   synth.connect(dest);
  //   synth.toDestination();

  //   const url1: string = tracksData[3].clips[0].url;
  //   const player = new Tone.Player(url1).toDestination();
  //   player.connect(dest);
  //   Tone.loaded().then(() => {
  //     player.start();
  //   });

  //   const chunks: any[] = [];

  //   const notes = "CDEFGAB".split("").map((notation) => `${notation}4`);
  //   let note = 0;
  //   Tone.Transport.scheduleRepeat((time) => {
  //     if (note === 0) recorder.start();
  //     if (note > notes.length) {
  //       synth.triggerRelease(time);
  //       recorder.stop();
  //       Tone.Transport.stop();
  //       player.stop();
  //     } else synth.triggerAttack(notes[note], time);
  //     note++;
  //   }, "4n");

  //   recorder.ondataavailable = (event) => chunks.push(event.data);
  //   recorder.onstop = (event) => {
  //     let blob = new Blob(chunks, { type: "audio/mp3" });
  //     console.log(URL.createObjectURL(blob));
  //     if (audio) {
  //       audio.src = URL.createObjectURL(blob);
  //     }
  //   };

  //   Tone.Transport.start();
  // };

  return (
    <Container>
      {/* <audio controls></audio>
      <button onClick={exportAudio}>export</button> */}
      <TimeRuler>+</TimeRuler>
      <TracksPanel>
        <ProgressLine progress={progress} barWidth={barWidth} />
        {tracksData &&
          tracksData.length > 0 &&
          tracksData.map((track, index) => {
            return (
              <Track
                key={`${track.trackName}-${index}`}
                onClick={() => {
                  handleSelectTrack(track.id, index);
                }}
                selectedColor={
                  selectedTrackId === track.id ? "#2F302F" : "#606060"
                }
                trackHeight={projectData.trackHeight}
              >
                <TrackControls>
                  <TrackTitle>{track.trackName}</TrackTitle>
                  <TrackButtons>
                    <IsSoloButton
                      onClick={() => {
                        handleTrackSolo(!track.isSolo, track.id);
                      }}
                      isSolo={track.isSolo}
                    >
                      Solo
                    </IsSoloButton>
                    <IsMutedButton
                      onClick={() => {
                        handleTrackMute(!track.isMuted, track.id);
                      }}
                      isMuted={track.isMuted}
                    >
                      Mute
                    </IsMutedButton>
                  </TrackButtons>
                </TrackControls>
                <Clip>
                  {track.type === "audio" ? (
                    <Draggable
                      axis="both"
                      onDrag={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => handleClipDraggable(event, dragElement, index)}
                      grid={[barWidth, 0]}
                      position={{
                        x:
                          tracksData[index]?.clips[0].startPoint.bars * 16 +
                          tracksData[index]?.clips[0].startPoint.quarters * 4 +
                          tracksData[index]?.clips[0].startPoint.sixteenths *
                            barWidth,
                        y: 0,
                      }}
                      // defaultPosition={{ x: 0, y: 0 }}
                      handle=".handle"
                      bounds={{ left: 0 }}
                    >
                      <>
                        <ClipTitle
                          onClick={() => {
                            console.log("!");
                          }}
                          className="handle"
                        >
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
                        // progress={progress}
                      />
                    </>
                  )}

                  <Measures
                    projectData={projectData}
                    // onClick={(event) => {
                    //   handleSetProgressLine(event);
                    // }}
                  />
                </Clip>
              </Track>
            );
          })}
      </TracksPanel>
    </Container>
  );
};

export default Tracks;
