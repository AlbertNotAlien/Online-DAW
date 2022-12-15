import { useState } from "react";

class AudioHandler {
  play() {}
  pause() {}
  cut() {
    const clip = new Clip();
    const timing = clip.cut();

    const clip1;
  }

  recording() {
    // recording...

    const clip = new Clip();
    return clip;
  }
}

class AudioFile {
  id;
  filePath;
}

class Clip {
  start;
  end;
  audioFileId;

  constructor(start: number, end: number, audioFileId: number) {
    this.start = start;
    this.end = end;
    this.audioFileId = audioFileId;
  }

  cut() {
    return "現在被cut的時間點";
  }
}

const Track = () => {
  const [data, setData] = useState({
    measure: 100,
    volume: 100,
    pan: 0,
    isSolo: false,
    isMute: false,
    isSelected: false,
    clips: [Clip, Clip, Clip, Clip, Clip, Clip],
    audios: [AudioFile, AudioFile],
  });

  const clip = new Clip();

  return <div className="track">This is Track</div>;
};

export default Track;
