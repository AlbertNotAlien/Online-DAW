import {
  useState,
  useEffect,
  useRef,
  MouseEvent,
  MutableRefObject,
} from "react";
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
import { db } from "../../../config/firebase";
import { storage } from "../../../config/firebase";
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
} from "../../../store/atoms";
import { style } from "wavesurfer.js/src/util";
import { Channel } from "tone";

const Container = styled.div`
  max-width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  padding: 0px 15px;
  row-gap: 10px;
  /* position: fixed; */
  top: 0px;
  left: 0px;
  background-color: #676767;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
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

const RangePanels = styled.div``;

const RangePanel = styled.div`
  height: 20px;
  width: 50%;
  border-radius: 5px;
  /* margin-left: 20px; */
  position: relative;
  display: flex;
  align-items: center;
  /* justify-content: center; */
  column-gap: 10px;
`;

const VolumeControl = styled.div`
  height: 100%;
  width: 80%;
  background-color: #9ec3ba;
  position: absolute;
  left: 0px;
`;

const RangeInput = styled.input`
  text-align: center;
  color: white;
  font-size: 10px;
  /* position: absolute; */
  height: 100%;
  border: none;
  &:focus {
    outline: none;
  }
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

interface IsSoloButtonProps {
  isSolo: boolean;
}

interface IsMutedButtonProps {
  isMuted: boolean;
}

// const IsSoloButton = styled(TrackButton)<IsSoloButtonProps>`
//   background-color: ${(props) => (props.isSolo ? "#F6DDCD" : "#7c7c7c")};
// `;

const RangeValue = styled.p`
  font-size: 10px;
  min-width: 30px;
`;

const IsMutedButton = styled(TrackButton)<IsMutedButtonProps>`
  color: white;
  background-color: ${(props) =>
    props.isMuted === true ? "#383838" : "#7c7c7c"};
`;

interface TrackControlsProps {
  channelsRef: MutableRefObject<Channel[]>;
  projectId: string;
  track: TrackData;
  trackIndex: number;
  isMuted: boolean;
}

const TrackControls = (props: TrackControlsProps) => {
  const projectId = props.projectId;
  const [tracksData, setTracksData] = useRecoilState(tracksDataState);
  const [volume, setVolume] = useState(0);
  const [pan, setPan] = useState(0);

  useEffect(() => {
    setVolume(tracksData[props.trackIndex].volume);
    setPan(tracksData[props.trackIndex].pan);
  }, [tracksData]);

  const handleTrackMute = async (
    isMuted: boolean,
    trackId: string,
    trackIndex: number
  ) => {
    console.log("isMuted", isMuted);
    console.log("projectId", projectId);
    console.log("trackId", trackId);

    setTracksData(
      produce(tracksData, (draft) => {
        draft[props.trackIndex].isMuted = !isMuted;
      })
    );

    props.channelsRef.current[trackIndex].mute = !isMuted;

    props.channelsRef.current.forEach((channel: Channel, index: number) => {
      console.log(`mute-${index}`, channel.mute);
    });
    console.log("-----");

    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        isMuted: !isMuted,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  // const handleTrackSolo = async (
  //   isSolo: boolean,
  //   trackId: string,
  //   trackIndex: number
  // ) => {
  //   // try {
  //   //   const trackRef = doc(db, "projects", projectId, "tracks", trackId);
  //   //   const newData = {
  //   //     isSolo: !isSolo,
  //   //   };
  //   //   await updateDoc(trackRef, newData);
  //   //   console.log("info updated");
  //   // } catch (err) {
  //   //   console.log(err);
  //   // }

  //   // console.log(props.channelsRef.current[trackIndex]);

  //   props.channelsRef.current[trackIndex].solo =
  //     !props.channelsRef.current[trackIndex].solo;
  // };

  const handleTrackVolume = async (
    volume: number,
    trackId: string,
    trackIndex: number
  ) => {
    console.log("projectId", projectId);
    console.log("trackId", trackId);

    setTracksData(
      produce(tracksData, (draft) => {
        draft[trackIndex].volume = volume;
      })
    );

    props.channelsRef.current[trackIndex].volume.value = volume;

    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        volume: volume,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  const handleTrackPan = async (
    pan: number,
    trackId: string,
    trackIndex: number
  ) => {
    console.log("projectId", projectId);
    console.log("trackId", trackId);

    setTracksData(
      produce(tracksData, (draft) => {
        draft[props.trackIndex].pan = pan;
      })
    );

    props.channelsRef.current[trackIndex].pan.value = pan;

    try {
      const trackRef = doc(db, "projects", projectId, "tracks", trackId);
      const newData = {
        pan: pan,
      };
      await updateDoc(trackRef, newData);
      console.log("info updated");
    } catch (err) {
      console.log(err);
    }
  };

  const TitleAndMute = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  return (
    <>
      <Container>
        <TitleAndMute>
          <TrackTitle>{props.track.name}</TrackTitle>
          <TrackButtons>
            <IsMutedButton
              onClick={() => {
                handleTrackMute(
                  props.isMuted,
                  props.track.id,
                  props.trackIndex
                );
              }}
              isMuted={props.isMuted}
            >
              Mute
            </IsMutedButton>
          </TrackButtons>
        </TitleAndMute>

        {/* {props.channelsRef.current !== false && ( */}
        <RangePanels>
          <RangePanel>
            <RangeValue>{`${Math.floor(volume)}db`}</RangeValue>
            <RangeInput
              type="range"
              value={volume}
              min={-70}
              max={10}
              onChange={(event) => {
                console.log(event.target.value);
                const value =
                  event.target.value === null
                    ? 0
                    : Math.floor(Number(event.target.value));
                setVolume(value);
                handleTrackVolume(value, props.track.id, props.trackIndex);
              }}
            />
          </RangePanel>
          <RangePanel>
            <RangeValue>
              {(Math.abs(pan * 100) < 1 && "C") ||
                (pan * 100 >= 1 && `${Math.floor(pan * 50)}R`) ||
                (pan * 100 <= -1 && `${Math.floor(pan * 50)}L`)}
            </RangeValue>
            <RangeInput
              type="range"
              value={pan * 100}
              min={-100}
              max={100}
              step={0.1}
              onChange={(event) => {
                const value = Number(event.target.value) / 100;
                console.log(value);
                setPan(value);
                handleTrackPan(value, props.track.id, props.trackIndex);
              }}
            />
          </RangePanel>
        </RangePanels>
        {/* )} */}
      </Container>
    </>
  );
};

export default TrackControls;
