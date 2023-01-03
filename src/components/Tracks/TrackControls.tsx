import { useState, useEffect, MutableRefObject } from "react";
import styled from "styled-components";
import { useRecoilState } from "recoil";
import { produce } from "immer";

import { doc, updateDoc } from "firebase/firestore";
import { Channel } from "tone";
import { tracksDataState, TrackData } from "../../store/atoms";
import { db } from "../../config/firebase";

const Container = styled.div`
  min-width: 200px;
  width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: left;
  padding: 0px 15px;
  row-gap: 10px;
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

// const TrackButton = styled.button`
//   height: 20px;
//   border: none;
//   border-radius: 5px;
// `;

const RangePanels = styled.div``;

const RangePanel = styled.div`
  height: 20px;
  width: 100%;
  border-radius: 5px;
  position: relative;
  display: flex;
  align-items: center;
  column-gap: 10px;
`;

const RangeInput = styled.input`
  text-align: center;
  color: white;
  background-color: red;
  font-size: 10px;
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

// interface IsMutedButtonProps {
//   isMuted: boolean;
// }

const RangeValue = styled.p`
  font-size: 10px;
  min-width: 30px;
`;

// const IsMutedButton = styled(TrackButton)<IsMutedButtonProps>`
//   color: white;
//   background-color: ${(props) => (props.isMuted ? "#383838" : "#7c7c7c")};
//   cursor: pointer;
// `;

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

  // const handleTrackMute = async (
  //   isMuted: boolean,
  //   trackId: string,
  //   trackIndex: number
  // ) => {
  //   props.channelsRef.current[trackIndex].mute = !isMuted;

  //   setTracksData(
  //     produce(tracksData, (draft) => {
  //       draft[props.trackIndex].isMuted = !isMuted;
  //     })
  //   );

  //   try {
  //     const trackRef = doc(db, "projects", projectId, "tracks", trackId);
  //     const newData = {
  //       isMuted: !isMuted,
  //     };
  //     await updateDoc(trackRef, newData);
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const handleTrackVolume = async (
    volume: number,
    trackId: string,
    trackIndex: number
  ) => {
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
    } catch (err) {
      console.log(err);
    }
  };

  const handleTrackPan = async (
    pan: number,
    trackId: string,
    trackIndex: number
  ) => {
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
            {/* <IsMutedButton
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
            </IsMutedButton> */}
          </TrackButtons>
        </TitleAndMute>

        <RangePanels>
          <RangePanel>
            <RangeValue>{`${Math.floor(volume)}db`}</RangeValue>
            <RangeInput
              type="range"
              value={volume}
              min={-70}
              max={10}
              onChange={(event) => {
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
                setPan(value);
                handleTrackPan(value, props.track.id, props.trackIndex);
              }}
            />
          </RangePanel>
        </RangePanels>
      </Container>
    </>
  );
};

export default TrackControls;
