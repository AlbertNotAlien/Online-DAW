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
  deleteDoc,
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
  isPlayingState,
  isMetronomeState,
  isLoadingState,
  playerStatusState,
  TrackData,
  NoteData,
  AudioData,
  ClipData,
} from "../../lib/atoms";
import Measures from "./Measures";
import WaveSurfer from "./WaveSurfer";
import MidiBar from "./MidiBar";
import TrackControls from "./TrackControls";
import TimeRuler from "./TimeRuler";
import { style } from "wavesurfer.js/src/util";

interface ProjectData {
  trackHeight: number;
  barWidthCoefficient: number;
  id: string;
  name: string;
  tempo: number;
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

// const TimeRuler = styled.div`
//   min-height: 30px;
//   width: 100%;
//   border-radius: 10px;
//   background-color: gray;
//   display: flex;
//   align-items: center;
//   padding-left: 10px;
//   font-size: 20px;
//   line-height: 20px;
// `;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  overflow: scroll;
`;

const ProgressLine = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: #c08a1e;
  height: calc(100vh - 50px - 200px - 70px);
  /* height: 500px; */
  position: absolute;
  left: ${(props) =>
    props.progress.bars * props.barWidth * 4 +
    props.progress.quarters * props.barWidth +
    (props.progress.sixteenths * props.barWidth) / 4}px;
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

const Timeline = styled.div`
  position: relative;
`;

const Clip = styled.div`
  position: absolute;
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

  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const [progress, setProgress] = useRecoilState(progressState);

  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );

  const isMetronome = useRecoilValue(isMetronomeState);

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

  const updateClipsPosition = async (clips: ClipData[], trackId: string) => {
    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        clips: clips,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  const handleClipDraggable = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    trackIndex: number,
    trackId: string
  ) => {
    // console.log("dragElementX", dragElement.x);
    const currentBar = Math.floor(dragElement.x / barWidth);

    const newBars = Math.floor(currentBar / 4);
    const newQuarters = currentBar % 4;

    // console.log("newBars", newBars);
    // console.log("newQuarters", newQuarters);

    if (tracksData && tracksData[trackIndex].clips) {
      const newTracksData = produce(tracksData, (draft) => {
        draft[trackIndex].clips[0].startPoint.bars = newBars;
        draft[trackIndex].clips[0].startPoint.quarters = newQuarters;
      });
      setTracksdata(newTracksData);
      const newClipsData = produce(tracksData[trackIndex].clips, (draft) => {
        draft[0].startPoint.bars = newBars;
        draft[0].startPoint.quarters = newQuarters;
      });
      updateClipsPosition(newClipsData, trackId);
    }
  };

  const [instrument, setInstrument] = useState<Tone.Synth>();
  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);

  const now = Tone.now();

  // cause Tone.js can't run in SSR
  useEffect(() => {
    const vol = new Tone.Volume(-50).toDestination();
    const newSynth = new Tone.Synth().connect(vol).toDestination();
    setInstrument(newSynth);
    Tone.Transport.bpm.value = 58; //////////////////////////////////////////////////////////
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

  // const soloTrack = (track: TrackData) => {
  //   const soloTrack = new Tone.Solo().toDestination();
  //   track
  //   soloTrack.solo = true;
  // };

  const handlePlayMidi = (note: NoteData) => {
    if (instrument) {
      Tone.Transport.schedule(function (time) {
        instrument.triggerAttackRelease(
          `${note.notation}${note.octave}`,
          `${note.length.bars}:${note.length.quarters}:${note.length.sixteenths}`
        );
      }, `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`);
    }
  };

  const handlePlayAudio = (clip: AudioData) => {
    const player = new Tone.Player(clip.url).toDestination();
    Tone.Transport.schedule(function (time) {
      player.sync().start();
    }, `${clip.startPoint.bars}:${clip.startPoint.quarters}:${clip.startPoint.sixteenths}`);
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (selectedTrackId) {
      console.log(trackId);
      await deleteDoc(doc(db, "projects", projectId, "tracks", trackId));
    }
  };

  useEffect(() => {
    if (
      instrument &&
      (playerStatus === "playing" || playerStatus === "recording")
    ) {
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

      const startPlaying = async () => {
        Tone.Transport.position = `${progress.bars}:${progress.quarters}:${progress.sixteenths}`;

        tracksData
          ?.filter((track) => track.type === "midi")
          .forEach((track) =>
            track.clips[0].notes.forEach((note: NoteData, index: number) => {
              handlePlayMidi(note);
            })
          );

        tracksData
          ?.filter((track) => track.type === "audio")
          .forEach((track) => handlePlayAudio(track.clips[0]));

        setIsLoading(true);

        Tone.loaded().then(() => {
          Tone.Transport.start();
          setIsLoading(false);
        });
        await Tone.start();
      };

      startPlaying();

      return () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        clearInterval(timer);
      };
    } else if (instrument && playerStatus === "paused") {
      Tone.Transport.pause();
    }
  }, [instrument, playerStatus, isMetronome]);

  useEffect(() => {
    if (
      (playerStatus === "playing" || playerStatus === "recording") &&
      isMetronome
    ) {
      const synth = new Tone.Synth().toDestination();
      Tone.Transport.scheduleRepeat((time) => {
        synth.triggerAttackRelease("C6", 0.01);
      }, "4n");
    }
  }, [playerStatus, isMetronome]);

  return (
    <Container>
      <TimeRuler handleUploadAudio={props.handleUploadAudio} />
      <TracksPanel>
        <ProgressLine progress={progress} barWidth={barWidth} />
        {tracksData &&
          tracksData.length > 0 &&
          tracksData.map((track, trackIndex) => {
            return (
              <Track
                key={`${track.trackName}-${trackIndex}`}
                onClick={() => {
                  handleSelectTrack(track.id, trackIndex);
                }}
                selectedColor={
                  selectedTrackId === track.id ? "#2F302F" : "#606060"
                }
                trackHeight={projectData.trackHeight}
                onDoubleClick={() => {
                  console.log("onDoubleClick");
                  handleDeleteTrack(track.id);
                }}
              >
                <TrackControls track={track} />
                <Timeline>
                  <Clip>
                    <Draggable
                      axis="both"
                      onDrag={(
                        event: DraggableEvent,
                        dragElement: DraggableData
                      ) => {
                        handleClipDraggable(
                          event,
                          dragElement,
                          trackIndex,
                          track.id
                        );
                        // console.log("onDrag", dragElement.x, dragElement.y);
                      }}
                      // onStart={(
                      //   event: DraggableEvent,
                      //   dragElement: DraggableData
                      // ) => {
                      //   console.log(
                      //     "onStart",
                      //     dragElement.lastX,
                      //     dragElement.lastY
                      //   );
                      // }}
                      grid={[barWidth, 0]}
                      position={{
                        x:
                          (tracksData[trackIndex].clips[0].startPoint.bars * 4 +
                            tracksData[trackIndex].clips[0].startPoint
                              .quarters +
                            tracksData[trackIndex].clips[0].startPoint
                              .sixteenths /
                              4) *
                          barWidth,
                        y: 0,
                      }}
                      handle=".handle"
                      bounds={{ left: 0 }}
                    >
                      <div>
                        <ClipTitle
                          onClick={() => {
                            console.log("!");
                          }}
                          className="handle"
                        >
                          {track.clips[0].clipName}
                        </ClipTitle>
                        {track.type === "audio" ? (
                          <WaveSurfer
                            key={trackIndex}
                            index={trackIndex}
                            projectData={projectData}
                            trackData={tracksData[trackIndex]}
                            convertMsToBeats={props.convertMsToBeats}
                            convertBeatsToMs={props.convertBeatsToMs}
                          />
                        ) : (
                          <MidiBar
                            isPlaying={isPlaying}
                            projectData={projectData}
                            trackData={tracksData[trackIndex]}
                            barWidth={barWidth}
                          />
                        )}
                      </div>
                    </Draggable>
                  </Clip>
                  <Measures projectData={projectData} />
                </Timeline>
              </Track>
            );
          })}
      </TracksPanel>
    </Container>
  );
};

export default Tracks;
