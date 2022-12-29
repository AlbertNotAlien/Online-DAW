import Image from "next/image";
import {
  useState,
  useEffect,
  useRef,
  SetStateAction,
  Dispatch,
  MutableRefObject,
} from "react";
import styled from "styled-components";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import Draggable, { DraggableData, DraggableEvent } from "react-draggable";
import { produce } from "immer";
import * as Tone from "tone";

import { doc, updateDoc, deleteDoc } from "firebase/firestore";

import { Channel } from "tone";
import useRecorder from "../../utils/useRecorder";
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
  ClipData,
  inputProgressState,
  isRecordingState,
} from "../../store/atoms";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../config/firebase";
import TimeRuler from "./TimeRuler";
import TrackControls from "./TrackControls";
import MidiBar from "./MidiBar";
import WaveSurfer from "./WaveSurfer";
import Measures from "./Measures";

interface TrackProps {
  trackHeight: number;
  selectedBySelf: boolean;
  selectedByOthers: boolean;
}

interface ProgressLineProps {
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
`;

const TracksPanel = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  width: 100%;
`;

const ProgressLine = styled.div<ProgressLineProps>`
  width: 1px;
  background-color: #c08a1e;
  height: ${(props) =>
    props.tracksDataLength * 150 + (props.tracksDataLength - 1) * 10}px;
  position: absolute;
  left: ${(props) =>
    (props.progress.bars * 4 +
      props.progress.quarters +
      props.progress.sixteenths * 0.25) *
    props.barWidth}px;
  margin-left: 200px;
  z-index: 1;
`;

const Track = styled.div<TrackProps>`
  position: relative;
  display: flex;
  width: 10200px;
  margin-bottom: 10px;
  border-radius: 10px;
  height: ${(props) => props.trackHeight}px;
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

interface RecordingLengthBarProps {
  recordingClipLength: number;
}

const RecordingLengthBar = styled.div<RecordingLengthBarProps>`
  width: ${(props) => props.recordingClipLength}px;
  height: 150px;
  background-color: #f6ddcd;
  position: absolute;
  bottom: 0px;
`;

interface TracksProps {
  progress: {
    bars: number;
    quarters: number;
    sixteenths: number;
  };
  projectId: string;
  handleUploadAudio: Function;
  updateSelectedTrackIndex: Function;
  isModalOpen: boolean;
  setIsModalOpen: Dispatch<SetStateAction<boolean>>;
  cleanupSelectedBy: Function;
  recordStartTimeRef: MutableRefObject<{
    bars: number;
    quarters: number;
    sixteenths: number;
  }>;
  appendToFilename: Function;
}

const Tracks = (props: TracksProps) => {
  const [isHoverClipContent, setIsHoverClipContent] = useState(false);
  const projectData = useRecoilValue(projectDataState);

  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const barWidth = useRecoilValue(barWidthState);

  const projectId = props.projectId;

  const isPlaying = useRecoilValue(isPlayingState);
  const setIsLoading = useSetRecoilState(isLoadingState);
  const playerStatus = useRecoilValue(playerStatusState);

  const [progress, setProgress] = useRecoilState(progressState);
  const setInputProgress = useSetRecoilState(inputProgressState);

  const [selectedTrackId, setSelectedTrackId] =
    useRecoilState(selectedTrackIdState);
  const [selectedTrackIndex, setSelectedTrackIndex] = useRecoilState(
    selectedTrackIndexState
  );
  const { user } = useAuth();
  const isMetronome = useRecoilValue(isMetronomeState);
  const isRecording = useRecoilValue(isRecordingState);

  const TracksPanelRef = useRef(null);

  const [recordFile, , , ,] = useRecorder();

  const channelsRef = useRef<Channel[]>([]);
  const tracksRef =
    useRef<(Tone.Synth | Tone.Player | undefined)[] | undefined>();

  const playingNote = useRecoilValue(playingNoteState);

  useEffect(() => {
    if (
      !Array.isArray(channelsRef.current) ||
      channelsRef.current.length === 0 ||
      channelsRef.current.length !== tracksData.length ||
      recordFile
    ) {
      tracksRef.current = tracksData?.map((track) => {
        if (track.type === "midi" && channelsRef.current) {
          const newSynth = new Tone.Synth();
          return newSynth;
        } else if (
          (track.type === "audio" ||
            (track.type === "record" && track.clips[0].url)) &&
          channelsRef.current
        ) {
          const buffer = new Tone.Buffer(track.clips[0].url);
          const player = new Tone.Player(buffer);
          return player;
        }
      });

      channelsRef.current = tracksData?.map((track) => {
        const channel = new Tone.Channel().toDestination();
        channel.mute = track.isMuted;
        return channel;
      });

      tracksRef.current?.forEach((trackRef, index) => {
        if (trackRef && channelsRef.current) {
          trackRef.connect(channelsRef.current[index]);
        }
      });
    }

    channelsRef.current.forEach((channel, index) => {
      if (channel.mute !== tracksData[index].isMuted) {
        channel.mute = tracksData[index].isMuted;
      }
      if (channel.volume.value !== tracksData[index].volume) {
        channel.volume.value = tracksData[index].volume;
      }
      if (channel.pan.value !== tracksData[index].pan) {
        channel.pan.value = tracksData[index].pan;
      }
    });
  }, [tracksData]);

  const playAllTracks = () => {
    if (tracksRef.current) {
      tracksRef.current.forEach((trackRef, index) => {
        if (trackRef instanceof Tone.Player && tracksData) {
          trackRef
            .sync()
            .start(
              `${tracksData[index].clips[0].startPoint.bars}:${tracksData[index].clips[0].startPoint.quarters}:${tracksData[index].clips[0].startPoint.sixteenths}`
            );
        } else if (trackRef instanceof Tone.Synth && tracksData) {
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
    Tone.Transport.position = `${progress.bars}:${progress.quarters}:${progress.sixteenths}`;
    Tone.Transport.start();
    playAllTracks();
  };

  useEffect(() => {
    Tone.Transport.bpm.value = projectData.tempo;

    if (playerStatus === "playing" || playerStatus === "recording") {
      setIsLoading(true);

      const startTone = async () => {
        await Tone.start();
      };

      Tone.loaded().then(() => {
        startTone();
        startPlaying();
        setIsLoading(false);
      });

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

      return () => {
        clearInterval(timer);
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
      };
    } else if (playerStatus === "paused") {
      stopPlaying();
    }
  }, [playerStatus]);

  useEffect(() => {
    const recordStartTime = props.recordStartTimeRef.current;

    if (isRecording) {
      setRecordingClipLength(
        ((progress.bars - recordStartTime.bars) * 4 +
          (progress.quarters - recordStartTime.quarters) * 1 +
          (progress.sixteenths - recordStartTime.sixteenths) * 0.25) *
          barWidth
      );
    }
  }, [progress, props.recordStartTimeRef.current, isRecording]);

  const [recordingClipLength, setRecordingClipLength] = useState(0);

  const handleSelectTrack = async (trackId: string, trackIndex: number) => {
    if (
      tracksData &&
      trackId !== selectedTrackId &&
      trackIndex !== selectedTrackIndex
    ) {
      props.cleanupSelectedBy();
      setSelectedTrackId(trackId);
      setSelectedTrackIndex(trackIndex);

      try {
        const docRef = doc(db, "projects", projectId, "tracks", trackId);
        const newData = {
          selectedBy: user?.uid,
        };
        await updateDoc(docRef, newData);
      } catch (err) {
        console.log(err);
      }
    }
  };

  const [dragX, setDragX] = useState<number[]>([]);

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

  useEffect(() => {
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
    trackIndex: number
  ) => {
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

  const playNote = (trackRef: Tone.Synth, notation: string, octave: number) => {
    const now = Tone.now();
    if (trackRef) {
      trackRef.triggerAttackRelease(`${notation}${octave}`, "8n", now);
    }
  };

  useEffect(() => {
    if (typeof selectedTrackIndex !== "number") return;
    const synthRef = tracksRef.current?.[selectedTrackIndex];
    if (playingNote && synthRef instanceof Tone.Synth) {
      playNote(synthRef, playingNote.notation, playingNote.octave);
    }
  }, [playingNote, selectedTrackIndex]);

  const handleDeleteTrack = async (trackId: string) => {
    setSelectedTrackIndex(null);
    setSelectedTrackId(null);
    await deleteDoc(doc(db, "projects", projectId, "tracks", trackId));
  };

  useEffect(() => {
    if (selectedTrackId !== null) {
      const handleKeydown = (event: KeyboardEvent) => {
        if (event.key === "Backspace" || event.key === "Delete") {
          handleDeleteTrack(selectedTrackId);
        }
      };
      document.addEventListener("keydown", handleKeydown);
      return () => document.removeEventListener("keydown", handleKeydown);
    }
  });

  const metronomeRef = useRef<Tone.Synth | null>(null);
  const metronomeTrackRef = useRef<Tone.Channel | null>(null);

  useEffect(() => {
    metronomeRef.current = new Tone.Synth();
    metronomeTrackRef.current = new Tone.Channel().toDestination();

    metronomeRef.current.connect(metronomeTrackRef.current);
    metronomeTrackRef.current.mute = !isMetronome;

    if (playerStatus === "playing" || playerStatus === "recording") {
      Tone.Transport.scheduleRepeat(() => {
        if (!metronomeRef.current || !metronomeTrackRef.current) return;
        metronomeRef.current.triggerAttackRelease("C6", 0.01);
      }, "4n");
    }
  }, [playerStatus]);

  useEffect(() => {
    if (
      !metronomeTrackRef.current ||
      !(playerStatus === "playing" || playerStatus === "recording")
    )
      return;

    metronomeTrackRef.current.mute = !isMetronome;
  }, [playerStatus, isMetronome]);

  const tracksContainerRef = useRef(null);

  return (
    <Container ref={tracksContainerRef}>
      <TimeRuler
        handleUploadAudio={props.handleUploadAudio}
        updateSelectedTrackIndex={props.updateSelectedTrackIndex}
        isModalOpen={props.isModalOpen}
        setIsModalOpen={props.setIsModalOpen}
        appendToFilename={props.appendToFilename}
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
                key={track.id}
                onClick={() => {
                  handleSelectTrack(track.id, trackIndex);
                }}
                trackHeight={150}
                selectedBySelf={selectedTrackId === track.id}
                selectedByOthers={
                  track.selectedBy.length > 0 && track.selectedBy !== user?.uid
                }
              >
                {track.selectedBy.length > 0 && track.selectedBy !== user?.uid && (
                  <TrackLock>
                    <Image src="/lock.svg" alt="lock" width={25} height={25} />
                  </TrackLock>
                )}
                <TrackControls
                  channelsRef={channelsRef}
                  projectId={props.projectId}
                  track={track}
                  trackIndex={trackIndex}
                  isMuted={track.isMuted}
                />
                <Timeline>
                  <Draggable
                    axis="both"
                    onDrag={(
                      event: DraggableEvent,
                      dragElement: DraggableData
                    ) => {
                      handleClipDraggable(event, dragElement, trackIndex);
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
                        setIsHoverClipContent(true);
                      }}
                      onMouseLeave={() => {
                        setIsHoverClipContent(false);
                      }}
                      isHoverClipContent={isHoverClipContent}
                    >
                      <ClipTitle className="handle">
                        {track.clips[0].clipName}
                      </ClipTitle>
                      <ClipContent>
                        {track.type === "audio" || track.type === "record" ? (
                          <WaveSurfer
                            projectData={projectData}
                            trackData={tracksData[trackIndex]}
                          />
                        ) : (
                          <MidiBar
                            isPlaying={isPlaying}
                            projectData={projectData}
                            trackData={tracksData[trackIndex]}
                            barWidth={barWidth}
                          />
                        )}

                        {isRecording &&
                          track.type === "record" &&
                          trackIndex === tracksData.length - 1 && (
                            <RecordingLengthBar
                              recordingClipLength={recordingClipLength}
                            />
                          )}
                      </ClipContent>
                    </Clip>
                  </Draggable>
                  <Measures />
                </Timeline>
              </Track>
            );
          })}
      </TracksPanel>
    </Container>
  );
};

export default Tracks;
