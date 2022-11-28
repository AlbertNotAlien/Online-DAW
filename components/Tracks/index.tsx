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
  deleteDoc,
  onSnapshot,
  DocumentData,
  orderBy,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../../config/firebase";
import { storage } from "../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
// import { useOnClickOutside } from "./useOnClickOutside";

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
} from "../../context/atoms";
import Measures from "./Measures";
import WaveSurfer from "./WaveSurfer";
import MidiBar from "./MidiBar";
import TrackControls from "./TrackControls";
import TimeRuler from "./TimeRuler";
import { style } from "wavesurfer.js/src/util";
import { Channel, PanVol, Volume } from "tone";

interface TrackProps {
  trackHeight: number;
  selectedBySelf: boolean;
  selectedByOthers: boolean;
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
  z-index: 1;
`;

const Track = styled.div<TrackProps>`
  position: relative;
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  border-radius: 10px;
  height: ${(props) => props.trackHeight}px;

  pointer-events: ${(props) => (props.selectedByOthers ? "none" : "inherit")};
  background-color: ${(props) =>
    (props.selectedByOthers && "#2F302F") ||
    (props.selectedBySelf && "#2F302F") ||
    "#606060"};
  opacity: ${(props) => (props.selectedByOthers ? 0.3 : 1)};
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

const Lock = styled.div`
  position: absolute;
  top: 50%;
  left: calc((100vw - 200px) / 2);
  z-index: 2;
`;

const Tracks = (props: any) => {
  const projectData = useRecoilValue(projectDataState);

  const [tracksData, setTracksdata] = useRecoilState(tracksDataState);
  const barWidth = useRecoilValue(barWidthState);

  const projectId = props.projectId;

  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const [progress, setProgress] = useRecoilState(progressState);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const { user, logout } = useAuth();
  const isMetronome = useRecoilValue(isMetronomeState);

  const channelsRef = useRef<Channel[] | undefined>([]);
  const tracksRef = useRef<
    (Tone.Synth | Tone.Player | undefined)[] | undefined
  >();

  useEffect(() => {
    channelsRef.current = tracksData?.map((_, index) => {
      const channel = new Tone.Channel().toDestination();
      return channel;
    });

    tracksRef.current = tracksData?.map((track, index) => {
      if (track.type === "midi" && channelsRef.current) {
        const newSynth = new Tone.Synth();
        return newSynth;
      } else if (track.type === "audio" && channelsRef.current) {
        const player = new Tone.Player(track.clips[0].url);
        return player;
      }
    });

    tracksRef.current?.forEach((trackRef, index) => {
      if (trackRef && channelsRef.current) {
        trackRef.connect(channelsRef.current[index]);
      }
    });

    // if (channelsRef.current) {
    // channelsRef.current[0].mute = true;
    // channelsRef.current[2].volume.value = 20;
    // channelsRef.current[2].pan.value = -1;
    // }
  }, [tracksData]);

  const playAllTracks = () => {
    if (tracksRef.current) {
      console.log("playAllTracks");
      tracksRef.current.forEach((trackRef, index) => {
        if (trackRef instanceof Tone.Player && tracksData) {
          console.log(trackRef);
          trackRef
            .sync()
            .start(
              `${tracksData[index].clips[0].startPoint.bars}:${tracksData[index].clips[0].startPoint.quarters}:${tracksData[index].clips[0].startPoint.sixteenths}`
            );
        } else if (trackRef instanceof Tone.Synth && tracksData) {
          console.log(trackRef);
          const notes = tracksData[index].clips[0].notes;
          notes.forEach((note) => {
            Tone.Transport.schedule(function () {
              trackRef.triggerAttackRelease(
                `${note.notation}${note.octave}`,
                `${note.length.bars}:${note.length.quarters}:${note.length.sixteenths}`
              );
            }, `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`);
          });
        }
      });
    }
  };

  const stopPlaying = () => {
    Tone.Transport.stop();
    Tone.Transport.cancel(0);
  };

  const startPlaying = () => {
    if (Tone.Transport.state === "started") return;
    // stopPlaying();
    console.log(`${progress.bars}:${progress.quarters}:${progress.sixteenths}`);
    playAllTracks();
    Tone.Transport.position = `${progress.bars}:${progress.quarters}:${progress.sixteenths}`;
    Tone.Transport.start();
  };

  useEffect(() => {
    const startTone = async () => {
      await Tone.start();
    };

    Tone.Transport.bpm.value = 58;

    if (playerStatus === "playing" || playerStatus === "recording") {
      const timer = setInterval(() => {
        const transportPosition = Tone.Transport.position
          .toString()
          .split(":")
          .map((element) => Number(element));
        setProgress({
          bars: transportPosition[0],
          quarters: transportPosition[1],
          sixteenths: transportPosition[2],
        });
      }, 100);

      Tone.loaded().then(() => {
        startTone();
        startPlaying();
      });

      return () => {
        clearInterval(timer);
      };
    } else if (playerStatus === "paused") {
      stopPlaying();
    }
  }, [playerStatus]);

  const handleSelectTrack = async (trackId: string, trackIndex: number) => {
    console.log(selectedTrackId);
    if (tracksData && selectedTrackId !== null) {
      try {
        const docRef = doc(
          db,
          "projects",
          projectId,
          "tracks",
          selectedTrackId // previous selectedTrackId
        );
        const newData = {
          selectedBy: "",
        };
        await updateDoc(docRef, newData);
        console.log("info updated");
      } catch (err) {
        console.log(err);
      } finally {
        setTracksdata(
          produce(tracksData, (draft) => {
            draft[trackIndex].selectedBy = user.uid;
          })
        );
        setSelectedTrackId(trackId);
        setSelectedTrackIndex(trackIndex);
      }
    } else if (tracksData && selectedTrackId === null) {
      setTracksdata(
        produce(tracksData, (draft) => {
          draft[trackIndex].selectedBy = user.uid;
        })
      );
      setSelectedTrackId(trackId);
      setSelectedTrackIndex(trackIndex);
    }

    try {
      const docRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        selectedBy: user.uid,
      };
      await updateDoc(docRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
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
    const currentBar = Math.floor(dragElement.x / barWidth);

    const newBars = Math.floor(currentBar / 4);
    const newQuarters = currentBar % 4;

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

  const [playingNote, setPlayingNote] = useRecoilState(playingNoteState);

  const now = Tone.now();

  const playNote = (trackRef: Tone.Synth, notation: string, octave: number) => {
    if (trackRef) {
      trackRef.triggerAttackRelease(`${notation}${octave}`, "8n", now);
      console.log("playNote");
    }
  };

  useEffect(() => {
    if (
      playingNote &&
      Array.isArray(tracksRef.current) &&
      typeof selectedTrackIndex === "number" &&
      tracksRef.current[selectedTrackIndex] instanceof Tone.Synth
    ) {
      const synthRef = tracksRef.current[selectedTrackIndex];
      if (synthRef instanceof Tone.Synth) {
        playNote(synthRef, playingNote.notation, playingNote.octave);
      }
    }
  }, [playingNote, selectedTrackIndex]);

  const handleDeleteTrack = async (trackId: string, event: KeyboardEvent) => {
    console.log("handleDeleteTrack");
    setSelectedTrackIndex(null);
    setSelectedTrackId(null);
    console.log("trackId", trackId);
    await deleteDoc(doc(db, "projects", projectId, "tracks", trackId));
  };

  useEffect(() => {
    if (selectedTrackId !== null) {
      window.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          handleDeleteTrack(selectedTrackId, event);
        }
      });
      return () =>
        window.removeEventListener("keydown", (event) => {
          if (event.key === "Backspace" || event.key === "Delete") {
            handleDeleteTrack(selectedTrackId, event);
          }
        });
    }
  });

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
      <TimeRuler
        handleUploadAudio={props.handleUploadAudio}
        updateSelectedTrackIndex={props.updateSelectedTrackIndex}
        isModalOpen={props.isModalOpen}
        setIsModalOpen={props.setIsModalOpen}
      />
      <TracksPanel>
        <ProgressLine progress={progress} barWidth={barWidth} />
        {projectData &&
          tracksData &&
          tracksData.length > 0 &&
          tracksData.map((track, trackIndex) => {
            return (
              <Track
                key={`${track.name}-${trackIndex}`}
                onClick={() => {
                  handleSelectTrack(track.id, trackIndex);
                }}
                trackHeight={150}
                // onDoubleClick={() => {
                //   handleDeleteTrack(track.id);
                // }}
                selectedBySelf={selectedTrackId === track.id}
                selectedByOthers={
                  track.selectedBy.length > 0 && track.selectedBy !== user.uid
                }
              >
                {track.selectedBy.length > 0 && track.selectedBy !== user.uid && (
                  <Lock>
                    <Image src="/lock.svg" alt="lock" width={25} height={25} />
                  </Lock>
                )}
                <TrackControls
                  channelsRef={channelsRef}
                  track={track}
                  trackIndex={trackIndex}
                />
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
