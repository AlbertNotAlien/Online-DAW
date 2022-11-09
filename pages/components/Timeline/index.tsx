import { useState, useEffect, useRef, MouseEvent } from "react";
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
import { db } from "../../../config/firebase";
import { storage } from "../../../config/firebase";
import { listAll, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import styled from "styled-components";
import Draggable from "react-draggable";

import Bars from "../Bars";
import WaveSurfer from "../WaveSurfer";
import Record from "../Record";
import useRecorder from "../Record/useRecorder";
import useTimer from "../Timer/useTimer";
import Tone from "../Tone";
import PianoRoll from "../PianoRoll";

interface ProgresslineProps {
  progressLinePosition: number;
}

interface MidiRegionProps {
  barWidth: number;
  length: number;
}

interface MidiNoteProps {
  barWidth: number;
  startTime: number;
  pitch: number;
}

interface ProjectsData {
  name: string;
  tempo: number;
}

interface TracksData {
  clips: [
    {
      clipName: string;
      startPoint: number;
      url: string;
    }
  ];
  id: string;
  isMuted: boolean;
  isSolo: boolean;
  trackName: string;
  type: string;
}

interface IsSoloButtonProps {
  isSolo: string;
}

interface IsMutedButtonProps {
  isMuted: string;
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

const TrackControls = styled.div`
  position: absolute;
  width: 200px;
  height: 150px;
  background-color: gray;
  display: flex;
  align-items: center;
`;

const TrackButton = styled.button`
  height: 20px;
  margin-left: 10px;
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

const MidiRegion = styled.div<MidiRegionProps>`
  width: ${(props) => props.barWidth * props.length}px;
  height: 130px;
  background-color: #ffffff20;
  /* border: 1px solid #ffffff; */
  /* margin-left: ${(props) => props.barWidth * 2}px; */
  position: relative;
`;

const MidiNote = styled.div<MidiNoteProps>`
  width: ${(props) => props.barWidth * 0.25}px;
  height: 5px;
  background-color: #ffffff;
  border: 1px solid #ffffff;
  position: absolute;
  bottom: ${(props) => props.pitch * 5}px;
  left: ${(props) => props.barWidth * 0.25 * props.startTime}px;
`;

const Timeline = () => {
  const [projectData, setProjectData] = useState<ProjectsData>({
    name: "",
    tempo: 0,
  });
  const [tracksData, setTracksdata] = useState<TracksData[]>([]);
  const projectId = "5BbhQTKKkFcM9nCjMG3I";
  const barWidthCoefficient = 9.5; // 一個bar長 9.5px/58bpm
  const barWidth = (120 / projectData.tempo) * barWidthCoefficient;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [trackPosition, setTrackPosition] = useState({ x: 0, y: 0 });
  const progressIncrementRef = useRef<number>(0);

  const uploadRef = useRef<HTMLInputElement>(null);
  const audioListRef = ref(storage, `projects/${projectId}/audios`);
  const [audioList, setAudioList] = useState<string[]>([]);

  const recordRef = useRef<HTMLDivElement>(null);
  const secondsRef = useRef<number>(0);
  const intervalRef = useRef<any>(null);

  const [selectedTrack, setSelectedTrack] = useState(null);

  const convertTimeToBars = (sec: number) => {
    const bars = (sec * projectData.tempo) / 60 + 1;
    return bars;
  };

  const convertBarsToTime = (bars: number) => {
    const sec = ((bars - 1) * 60) / projectData.tempo;
    return sec;
  };

  useEffect(() => {
    const docRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      const newData = snapshot.data() as ProjectsData;
      setProjectData(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const colRef = collection(db, "projects", projectId, "tracks");
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const newData = [] as TracksData[];
      snapshot.forEach((doc) => {
        const docData = doc.data() as TracksData;
        newData.push(docData);
      });
      setTracksdata(newData);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    listAll(audioListRef).then((response) => {
      response.items.forEach((item) => {
        getDownloadURL(item).then((url) => {
          setAudioList((prev) => [...prev, url]);
        });
      });
    });
  }, []);

  const handleClipDraggable = (
    event: any,
    dragElement: { x: number; y: number },
    index: number
  ) => {
    const positionX = Math.abs(dragElement.x) < barWidth ? 0 : dragElement.x;
    const currentBar = Math.floor(positionX / barWidth) + 1;
    setTrackPosition({ x: currentBar, y: 0 });
    tracksData[index].clips[0].startPoint = convertBarsToTime(currentBar);
  };

  const handlePlay = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      startTimer(progress);
    }
  };

  const handlePause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      pauseTimer();
    }
  };

  const startTimer = (prev_seconds: number) => {
    const startTime = new Date();

    intervalRef.current = setInterval(() => {
      const timeElapsed = new Date().getTime() - startTime.getTime(); // milliseconds
      const newMilliseconds = timeElapsed + prev_seconds * 1000;

      secondsRef.current = newMilliseconds / 1000;
      setProgress(secondsRef.current);
    }, 25);
  };

  const pauseTimer = () => {
    clearInterval(intervalRef.current);
  };

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
      setProgress(convertBarsToTime(currentBar + 1));
    }
  };

  const appendToFilename = (filename: string) => {
    const date = new Date();
    const fileDate = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}-${date.getMilliseconds()}`;

    if (filename?.lastIndexOf(".")) {
      const dotIndex = filename.lastIndexOf(".");
      if (dotIndex === -1) {
        return filename + "_" + fileDate;
      } else {
        return (
          filename.substring(0, dotIndex) +
          "_" +
          fileDate +
          filename.substring(dotIndex)
        );
      }
    } else {
      return filename + "_" + fileDate;
    }
  };

  const uploadFileInfo = async (
    trackName: string,
    type: string,
    clipName: string,
    startPoint: number,
    url: string,
    isMuted: boolean,
    isSolo: boolean
  ) => {
    try {
      const trackRef = doc(collection(db, "projects", projectId, "tracks"));
      const newData = {
        id: trackRef.id,
        trackName: trackName,
        type: type,
        isMuted: isMuted,
        isSolo: isSolo,
        clips: [
          {
            clipName: clipName,
            startPoint: startPoint,
            url: url,
          },
        ],
      };
      await setDoc(trackRef, newData);
      console.log("info uploaded");
    } catch (err) {
      console.log(err);
    }
  };

  const handleUploadAudio = (file: any) => {
    console.log("handleUploadAudio");
    console.log("file", file);

    if (file) {
      const newTrackName = `Audio ${tracksData.length + 1}`;
      const newFileName = appendToFilename(file.name || "record");
      const newStartPoint = 1;
      // const newStartPoint = convertTimeToBars(progress);

      const audioRef = ref(
        storage,
        `projects/${projectId}/audios/${newFileName}`
      );

      // const audioRef = ref(storage, `audios/${file.name + v4()}`);

      console.log("file", file);

      uploadBytes(audioRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((url) => {
          setAudioList((prev) => [...prev, url]);

          uploadFileInfo(
            newTrackName,
            "audio",
            newFileName,
            newStartPoint,
            url,
            false,
            false
          );
          console.log("uploadBytes");
        });
      });
    }
  };

  return (
    <>
      <Progressline
        progressLinePosition={(convertTimeToBars(progress) - 1) * barWidth}
      />
      <Controls>
        <button onClick={handlePlay}>Play</button>
        <button onClick={handlePause}>Pause</button>
        <span>bpm:</span>
        <input
          type="number"
          value={projectData.tempo}
          onChange={(event) => {
            setProjectData((prev) => ({
              ...prev,
              tempo: parseInt(event.target.value),
            }));
          }}
        ></input>
        <div className="progress">{`${Math.floor(
          convertTimeToBars(progress)
        )} 小節`}</div>
        <div>{`${progress.toFixed(3)} 秒`}</div>
      </Controls>
      <Controls>
        <input
          type="file"
          accept=".mp3,audio/*"
          multiple={false}
          ref={uploadRef}
          // onInput={handleUploadAudio}
        />
        <button
          onClick={() => {
            if (uploadRef.current?.files) {
              handleUploadAudio(uploadRef.current?.files[0]);
            }
          }}
        >
          Upload Audio
        </button>
      </Controls>
      <Controls>
        <Record
          handleUploadAudio={handleUploadAudio}
          handlePlay={handlePlay}
          handlePause={handlePause}
        />
      </Controls>
      <div>
        {tracksData.length > 0 &&
          tracksData.map((track, index) => {
            return (
              <TrackLine
                onClick={handleProgressLine}
                key={`${track.trackName}-${index}`}
              >
                <TrackControls>
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
                          convertBarsToTime(
                            tracksData[index].clips[0]?.startPoint
                          ) * barWidth,
                        y: 0,
                      }}
                      handle="#handle"
                      bounds={{ left: 0 }}
                    >
                      <div>
                        <ClipTitle id="handle">
                          {track.clips[0].clipName}
                        </ClipTitle>
                        <WaveSurfer
                          key={index}
                          index={index}
                          url={track.clips[0].url}
                          projectData={projectData}
                          isPlaying={isPlaying}
                          // isSolo={track.isSolo}
                          // isMuted={track.isMuted}
                          progress={progress}
                          tracksData={tracksData[index]}
                          convertTimeToBars={convertTimeToBars}
                          convertBarsToTime={convertBarsToTime}
                        />
                      </div>
                    </Draggable>
                  ) : (
                    <>
                      <ClipTitle />
                      <MidiRegion barWidth={barWidth} length={3}>
                        <MidiNote
                          barWidth={barWidth}
                          startTime={0}
                          pitch={10}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={1}
                          pitch={12}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={2}
                          pitch={15}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={3}
                          pitch={10}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={4}
                          pitch={12}
                        />
                        <MidiNote
                          barWidth={barWidth}
                          startTime={5}
                          pitch={15}
                        />
                      </MidiRegion>
                    </>
                  )}
                  <Bars projectData={projectData} />
                </Track>
              </TrackLine>
            );
          })}
      </div>
      <Tone
        isPlaying={isPlaying}
        projectData={projectData}
        tracksData={tracksData}
      />
      <PianoRoll
        tracksData={tracksData}
        projectData={projectData}
        projectId={projectId}
        trackId="xlYMCGoweMoNDeRabCjQ"
      />
    </>
  );
};

export default Timeline;
