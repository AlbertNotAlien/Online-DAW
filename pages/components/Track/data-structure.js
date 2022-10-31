const nextConfig = {
  data: {
    user: [
      {
        id: "0sZmZFRo77VHoEZ6DmdZmbzPykg1",
        email: "user1@example.com",
        name: "John Doe",
      },
      {
        id: "5tuwD2QJf3fyh7LCbSoGdfVCT8o2",
        email: "user2@example.com",
        name: "Albert Ke",
      },
    ],
    projects: [
      {
        id: "7oFvKfL9ZVOvIhum7FbgeVBaSRz1",
        name: "Project 1",
        tempo: 120,
        beat: {
          // 4/4 beat
          numerator: 4,
          denominator: 4,
        },
        measures: 100, //
        timeline: {
          //
          bars: 1,
          beats: 1,
          sixteenths: 1,
        },
        scale: 1,

        status: "playing", // "playing / stopped / recording"
        tool: "select", // select / cut
        selectedTrack: null, // 0/1/2...
        selectedClip: null, // clipsId
        // drag and drop

        isSolo: false, // 如果有其中一軌solo就是true

        tracks: [
          {
            name: "Track 1",
            measures: 100, //
            volume: 100,
            pan: 0,
            isSolo: false,
            isMute: false,
            isSelected: false,
            isRecording: false,
            clips: [
              //
              {
                id: "92SsfjamLRVdlaAtkhGnIcAsgqC3",
                url: "src/data/samples/fhg_bassloop_125_jzzfunk_A.mp3",
                fileId: "WsnLr4RpTqX9Ut8cDje3lDmSGD73",
                name: "Clip 1",
                duration: timestamp, /////////////// 總長的時間長度
                startTime: timestamp, /////////////// 剪輯後的時間長度
                endTime: timestamp, /////////////// 剪輯後的時間長度
                length: {
                  // 剪輯後的實際長度
                  bars: 1,
                  beats: 1, //1~4
                  sixteenths: 1,
                },
                startPoint: {
                  bars: 1,
                  beats: 1, //1~4
                  sixteenths: 1,
                },
                endPoint: {
                  /////////////// 從startPoint跟length calc出來
                  bars: 1,
                  beats: 1,
                  sixteenths: 1,
                },
              },
            ],
          },
        ],
        files: [
          {
            id: "WsnLr4RpTqX9Ut8cDje3lDmSGD73",
            url: "src/data/samples/fhg_bassloop_125_jzzfunk_A.mp3",
            fileName: "fhg_bassloop_125_jzzfunk_A",
            fileType: "mp3",
            audio: {
              // type: "record / import"
              duration: timestamp,
              channel: "stereo", // stereo/mono
              sampleRate: 44100, // 44.1kHz
            },
          },
        ],
      },
    ],
  },
};
