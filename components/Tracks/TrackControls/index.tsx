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
} from "../../../context/atoms";
import { style } from "wavesurfer.js/src/util";

const Container = styled.div`
  min-width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  padding: 0px 20px;
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

const RangePanels = styled.div`
  display: flex;
  column-gap: 10px;
`;

const RangePanel = styled.div`
  height: 20px;
  width: 100%;
  border-radius: 5px;
  background-color: #262626;
  position: relative;
  display: flex;
  overflow: hidden;
  align-items: center;
  justify-content: center;
`;

const VolumeControl = styled.div`
  height: 100%;
  width: 80%;
  background-color: #9ec3ba;
  position: absolute;
  left: 0px;
`;

// const VolumeControl = styled.input`
//   &:focus {
//     outline: none;
//   }

//   &::-webkit-slider-runnable-track {
//   }

//   &::-webkit-slider-thumb {
//     -webkit-appearance: none;
//     width: 25px;
//     height: 25px;
//     border-radius: 50%;
//     background-color: #e76f51;
//     cursor: pointer;
//   }
// `;

const PanControl = styled.div`
  height: 100%;
  width: 80%;
  background-color: #ccccbb;
  position: absolute;
  left: 0px;
`;

const RangeValue = styled.input`
  text-align: center;
  color: white;
  /* background-color: red; */
  font-size: 10px;
  position: absolute;
  height: 100%;
  /* pointer-events: none; */
  /* z-index: ; */
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

const IsSoloButton = styled(TrackButton)<IsSoloButtonProps>`
  background-color: ${(props) => (props.isSolo ? "#F6DDCD" : "#7c7c7c")};
`;

const IsMutedButton = styled(TrackButton)<IsMutedButtonProps>`
  background-color: ${(props) => (props.isMuted ? "#F6DDCD" : "#7c7c7c")};
`;

const TrackControls = (props: any) => {
  const projectId = props.projectId;

  const handleTrackMute = async (
    isMuted: boolean,
    trackId: string,
    trackIndex: number
  ) => {
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

    props.channelsRef.current[trackIndex].mute =
      !props.channelsRef.current[trackIndex].mute;

    props.channelsRef.current.forEach((channel: any, index: number) => {
      console.log(`mute-${index}`, channel.mute);
    });
    console.log("-----");
  };

  const handleTrackSolo = async (
    isSolo: boolean,
    trackId: string,
    trackIndex: number
  ) => {
    // try {
    //   const trackRef = doc(db, "projects", projectId, "tracks", trackId);
    //   const newData = {
    //     isSolo: !isSolo,
    //   };
    //   await updateDoc(trackRef, newData);
    //   console.log("info updated");
    // } catch (err) {
    //   console.log(err);
    // }

    // console.log(props.channelsRef.current[trackIndex]);

    props.channelsRef.current[trackIndex].solo =
      !props.channelsRef.current[trackIndex].solo;

    props.channelsRef.current.forEach((channelRef: any, index: number) => {
      console.log(`solo-${index}`, channelRef.solo);
      console.log(`mute-${index}`, channelRef.mute);
    });
    console.log("-----");
  };

  const [volume, setVolume] = useState(0);
  const [pan, setPan] = useState(0);

  return (
    <>
      <Container>
        <TrackTitle>{props.track.name}</TrackTitle>
        <TrackButtons>
          {/* <IsSoloButton
            onClick={() => {
              handleTrackSolo(
                props.track.isSolo,
                props.track.id,
                props.trackIndex
              );
            }}
            isSolo={props.track.isSolo}
          >
            Solo
          </IsSoloButton> */}
          <IsMutedButton
            onClick={() => {
              handleTrackMute(
                props.track.isMuted,
                props.track.id,
                props.trackIndex
              );
            }}
            isMuted={props.track.isMuted}
          >
            Mute
          </IsMutedButton>
        </TrackButtons>
        {props.channelsRef.current !== false && (
          <RangePanels>
            <RangePanel>
              <VolumeControl
              // onMouseDown={(event) => {
              //   handleVolumeChange(event);
              // }}
              />
              <RangeValue
                type="number"
                value={volume}
                onChange={(event) => {
                  console.log(event.target.value);
                  const value =
                    event.target.value === null
                      ? 0
                      : Math.floor(Number(event.target.value));
                  setVolume(value);
                  props.channelsRef.current[props.trackIndex].volume.value =
                    value;
                }}
              />
            </RangePanel>
            <RangePanel>
              <PanControl />
              <RangeValue
                type="number"
                value={pan}
                onChange={(event) => {
                  console.log(event.target.value);
                  const value = Math.floor(Number(event.target.value));
                  setPan(value);
                  props.channelsRef.current[props.trackIndex].pan.value = value;
                }}
              />
            </RangePanel>
          </RangePanels>
        )}
      </Container>
    </>
  );
};

export default TrackControls;
