class AudioHandler {
  cut() {}
}

export const Clip = (start: number, end: number) => {
  return {};
};

export const AudioFile = () => {
  return {};
};

export const Track = () => {
  const myClip = Clip(23, 456);
  const myAudio = AudioFile();
  return {
    measure: 100,
    volume: 100,
    pan: 0,
    isSolo: false,
    isMute: false,
    isSelected: false,
    clips: [myClip, myClip],
    audios: [myAudio, myAudio],
  };
};
