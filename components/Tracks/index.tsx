import Image from "next/image";
import { useState, useEffect, useRef, MouseEvent } from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import produce from "immer";
import * as Tone from "tone";
import Loader from "../Loader";

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
  inputProgressState,
} from "../../context/atoms";
import Measures from "./Measures";
import WaveSurfer from "./WaveSurfer";
import MidiBar from "./MidiBar";
import TrackControls from "./TrackControls";
import TimeRuler from "./TimeRuler";
import { style } from "wavesurfer.js/src/util";
import { Channel, PanVol, Volume } from "tone";
import { useOnClickOutside } from "../../utils/useOnClickOutside";
import Modal from "../Modal";

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
  tracksDataLength: number;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  row-gap: 10px;
  height: 100%;
  width: 100%;
  /* overflow: scroll; */
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
`;

const ProgressLine = styled.div<ProgresslineProps>`
  width: 1px;
  background-color: #c08a1e;
  height: ${(props) =>
    props.tracksDataLength * 150 + (props.tracksDataLength - 1) * 10}px;
  position: absolute;
  left: ${(props) =>
    props.progress.bars * props.barWidth * 4 +
    props.progress.quarters * props.barWidth +
    (props.progress.sixteenths * props.barWidth) / 4}px;
  margin-left: 200px;
  z-index: 1;
`;

const Track = styled.div<TrackProps>`
  position: relative;
  display: flex;
  width: 100%;
  margin-bottom: 10px;
  border-radius: 10px;
  height: ${(props) => props.trackHeight}px;
  /* background-color: ${(props) =>
    (props.selectedByOthers && "#282828") ||
    (props.selectedBySelf && "#282828") ||
    "#606060"}; */
  background-color: #282828;
  filter: brightness(100%);
  filter: ${(props) => props.selectedBySelf && "brightness(130%)"};
  opacity: ${(props) => (props.selectedByOthers ? 0.3 : 1)};
  pointer-events: ${(props) => (props.selectedByOthers ? "none" : "inherit")};
`;

const Timeline = styled.div`
  position: relative;
`;

interface ClipProps {
  isHoverClipContent: boolean;
}

const Clip = styled.div<ClipProps>`
  position: absolute;
  z-index: 0;
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

  &:hover {
    pointer-events: auto;
  }

  &:active {
    cursor: grabbing;
  }
`;

const ClipContent = styled.div`
  pointer-events: none;
`;

const TrackLock = styled.div`
  position: absolute;
  top: 50%;
  left: calc((100vw - 200px) / 2);
  z-index: 2;
`;

const Tracks = (props: any) => {
  const [_isHoverClipContent, _setIsHoverClipContent] = useState(false);
  const [isHoverClipContent, setIsHoverClipContent] = useState(false);
  const projectData = useRecoilValue(projectDataState);

  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const barWidth = useRecoilValue(barWidthState);

  const projectId = props.projectId;

  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [isLoading, setIsLoading] = useRecoilState(isLoadingState);
  const [playerStatus, setPlayerStatus] = useRecoilState(playerStatusState);

  const [progress, setProgress] = useRecoilState(progressState);
  const [inputProgress, setInputProgress] = useRecoilState(inputProgressState);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const { user, logout } = useAuth();
  const isMetronome = useRecoilValue(isMetronomeState);

  const TracksPanelRef = useRef(null);

  const channelsRef = useRef<Channel[] | undefined>([]);
  const tracksRef = useRef<
    (Tone.Synth | Tone.Player | undefined)[] | undefined
  >();

  // if (selectedTrackId !== null || selectedTrackIndex !== null) {
  //   window.addEventListener("beforeunload", function (e) {
  //     e.preventDefault();
  //     e.returnValue = "";
  //     props.cleanupSelectedBy();
  //   });
  // }

  useEffect(() => {
    channelsRef.current = tracksData?.map((track, index) => {
      const channel = new Tone.Channel().toDestination();
      channel.mute = track.isMuted;
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
  }, [tracksData]);

  if (channelsRef.current) {
    console.log("channelsRef.current[3]?.mute", channelsRef.current[3]?.mute);
  }

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
          const notes = tracksData[index].clips[0].notes;
          console.log(notes);
          notes.forEach((note) => {
            console.log(
              `${note.start.bars}:${note.start.quarters}:${note.start.sixteenths}`
            );
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
      setIsLoading(true);

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
        setInputProgress({
          bars: transportPosition[0],
          quarters: transportPosition[1],
          sixteenths: transportPosition[2],
        });
      }, 100);

      Tone.loaded().then(() => {
        startTone();
        startPlaying();
        setIsLoading(false);
      });

      return () => {
        clearInterval(timer);
      };
    } else if (playerStatus === "paused") {
      stopPlaying();
    }
  }, [playerStatus]);

  const handleSelectTrack = async (trackId: string, trackIndex: number) => {
    if (
      tracksData &&
      trackId !== selectedTrackId &&
      trackIndex !== selectedTrackIndex
    ) {
      props.cleanupSelectedBy();

      // setTracksData(
      //   produce(tracksData, (draft) => {
      //     draft[trackIndex].selectedBy = user.uid;
      //   })
      // );
      setSelectedTrackId(trackId);
      setSelectedTrackIndex(trackIndex);
      console.log("handleSelectTrack");

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
    }
  };

  const [dragX, setDragX] = useState<number[]>(
    tracksData?.map(
      (track) =>
        (track.clips[0].startPoint.bars * 4 +
          track.clips[0].startPoint.quarters) *
        barWidth
    )
  );

  useEffect(() => {
    setDragX(
      tracksData?.map(
        (track) =>
          (track.clips[0].startPoint.bars * 4 +
            track.clips[0].startPoint.quarters) *
          barWidth
      )
    );
  }, [tracksData]);

  const totalX = tracksData.reduce((acc, track) => {
    return (
      acc + track.clips[0].startPoint.bars + track.clips[0].startPoint.quarters
    );
  }, 0);

  // console.log(totalX);

  useEffect(() => {
    // update x state
    tracksData?.map(
      (track) =>
        (track.clips[0].startPoint.bars * 4 +
          track.clips[0].startPoint.quarters) *
        barWidth
    );
  }, [totalX]);

  const handleClipDraggable = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    trackIndex: number,
    trackId: string
  ) => {
    console.log("dragElement.x", dragElement.x);
    const newClipsPosition = produce(dragX, (draft) => {
      draft[trackIndex] = dragElement.x;
    });

    setDragX(newClipsPosition);
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

  const handleClipDraggableStop = (
    event: DraggableEvent,
    dragElement: { x: number; y: number },
    trackIndex: number,
    trackId: string
  ) => {
    const currentQuarters = Math.floor(dragElement.x / barWidth);

    const newBars = Math.floor(currentQuarters / 4);
    const newQuarters = currentQuarters % 4;

    console.log("dragElement.x", dragElement.x);
    console.log("barWidth", barWidth);
    console.log("currentQuarters", currentQuarters);
    console.log("currentQuarters", currentQuarters);
    console.log("newBars", newBars);
    console.log("newQuarters", newQuarters);

    if (tracksData && tracksData[trackIndex].clips) {
      const newTracksData = produce(tracksData, (draft) => {
        draft[trackIndex].clips[0].startPoint.bars = newBars;
        draft[trackIndex].clips[0].startPoint.quarters = newQuarters;
      });
      setTracksData(newTracksData);
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
    if (event.key === "Backspace" || event.key === "Delete") {
      console.log("handleDeleteTrack");
      setSelectedTrackIndex(null);
      setSelectedTrackId(null);
      await deleteDoc(doc(db, "projects", projectId, "tracks", trackId));
    }
  };

  useEffect(() => {
    if (selectedTrackId !== null) {
      const handleKeydown = (event: any) => {
        handleDeleteTrack(selectedTrackId, event);
      };
      document.addEventListener("keydown", handleKeydown);
      return () => document.removeEventListener("keydown", handleKeydown);
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

  const tracksContainerRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <Container ref={tracksContainerRef}>
      {/* {isLoading && (
        <Modal setIsModalOpen={setIsModalOpen}>
          <Loader />
        </Modal>
      )} */}
      <TimeRuler
        handleUploadAudio={props.handleUploadAudio}
        updateSelectedTrackIndex={props.updateSelectedTrackIndex}
        isModalOpen={props.isModalOpen}
        setIsModalOpen={props.setIsModalOpen}
      />
      <TracksPanel ref={TracksPanelRef}>
        <ProgressLine
          progress={progress}
          barWidth={barWidth}
          tracksDataLength={tracksData.length}
        />
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
                selectedBySelf={selectedTrackId === track.id}
                selectedByOthers={
                  track.selectedBy.length > 0 && track.selectedBy !== user.uid
                }
              >
                {track.selectedBy.length > 0 &&
                  track.selectedBy !== user.uid && (
                    <TrackLock>
                      <Image
                        src="/lock.svg"
                        alt="lock"
                        width={25}
                        height={25}
                      />
                    </TrackLock>
                  )}
                <TrackControls
                  channelsRef={channelsRef}
                  projectId={props.projectId}
                  track={track}
                  trackIndex={trackIndex}
                  isMuted={track.isMuted}
                  // isMuted={channelsRef?.current?.[trackIndex]?.mute ?? false}
                />
                <Timeline>
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
                    }}
                    onStop={(
                      event: DraggableEvent,
                      dragElement: DraggableData
                    ) => {
                      handleClipDraggableStop(
                        event,
                        dragElement,
                        trackIndex,
                        track.id
                      );
                    }}
                    grid={[barWidth, 0]}
                    position={{
                      x: dragX[trackIndex] || 0,
                      y: 0,
                    }}
                    handle=".handle"
                    bounds={{ left: 0 }}
                  >
                    <Clip
                      onClick={() => {
                        console.log("hover clip");
                        setIsHoverClipContent(true);
                      }}
                      onMouseLeave={() => {
                        console.log("leave hover clip");
                        setIsHoverClipContent(false);
                      }}
                      isHoverClipContent={isHoverClipContent}
                    >
                      <ClipTitle
                        className="handle"
                        onClick={() => {
                          console.log("click");
                        }}
                        // onMouseOver={() => {
                        //   console.log("hover");
                        //   setIsHoverClipContent(true);
                        // }}
                        // onMouseLeave={() => {
                        //   console.log("leave hover");
                        //   setIsHoverClipContent(false);
                        // }}
                      >
                        {track.clips[0].clipName}
                      </ClipTitle>
                      <ClipContent>
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
                      </ClipContent>
                    </Clip>
                  </Draggable>
                  <Measures
                    projectData={projectData}
                    // isHoverClipContent={isHoverClipContent}
                  />
                </Timeline>
              </Track>
            );
          })}
      </TracksPanel>
    </Container>
  );
};

export default Tracks;
