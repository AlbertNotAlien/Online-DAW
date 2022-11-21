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
import { db } from "../../../lib/firebase";
import { storage } from "../../../lib/firebase";
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
} from "../../../lib/atoms";
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

const RangeValue = styled.p`
  text-align: center;
  color: white;
  font-size: 10px;
  position: absolute;
  pointer-events: none;
  /* z-index: ; */
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
  const projectId = "5BbhQTKKkFcM9nCjMG3I";

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

  // const handleVolumeChange = (e: MouseEvent) => {
  //   console.log(e.nativeEvent.offsetX);
  // };

  const handleVolumeChange = (event: MouseEvent) => {
    console.log(event.clientY);
  };

  return (
    <>
      <Container>
        <TrackTitle>{props.track.trackName}</TrackTitle>
        <TrackButtons>
          <IsSoloButton
            onClick={() => {
              handleTrackSolo(!props.track.isSolo, props.track.id);
            }}
            isSolo={props.track.isSolo}
          >
            Solo
          </IsSoloButton>
          <IsMutedButton
            onClick={() => {
              handleTrackMute(!props.track.isMuted, props.track.id);
            }}
            isMuted={props.track.isMuted}
          >
            Mute
          </IsMutedButton>
        </TrackButtons>
        <RangePanels>
          {/* <Draggable
            // handle=".handle"
            axis="x"
            position={{ x: 0, y: 0 }}
            defaultPosition={{ x: 0, y: 0 }}
            onDrag={(event: DraggableEvent, dragElement: DraggableData) => {
              handleVolumeChange(event, dragElement);
            }}
            // bounds={{ left: 0, top: 0, right: 0, bottom: 0 }}
            // disabled={true}
            // allowAnyClick={true}
          > */}
          <RangePanel>
            {/* <VolumeControl type="range" /> */}
            <VolumeControl
              onMouseDown={(event) => {
                handleVolumeChange(event);
              }}
            />
            <RangeValue>-10.0</RangeValue>
          </RangePanel>
          {/* </Draggable> */}
          <RangePanel>
            <PanControl />
            <RangeValue>C</RangeValue>
          </RangePanel>
        </RangePanels>
      </Container>
    </>
  );
};

export default TrackControls;
