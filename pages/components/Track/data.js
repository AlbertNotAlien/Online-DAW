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
        timeline: {
          //
          bars: 1,
          beats: 1,
          sixteenths: 1,
        },
        measure: 100, //
        tracks: [
          {
            name: "Track 1",
            measure: 100, //
            level: 100,
            pan: 0,
            isSolo: false,
            isMute: false,
            isSelected: false,
            clips: [
              //
              {
                id: "92SsfjamLRVdlaAtkhGnIcAsgqC3",
                name: "Clip 1",
                length: timestamp, ///////////////
                startPoint: {
                  bars: 1,
                  beats: 1,
                  sixteenths: 1,
                },
                endPoint: {
                  ///////////////
                  bars: 1,
                  beats: 1,
                  sixteenths: 1,
                },
              },
            ],
            audios: [AudioFile, AudioFile], //
          },
        ],
      },
    ],
  },
};
