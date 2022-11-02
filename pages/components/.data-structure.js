const data = {
  users: [
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
      name: "project1",
      tempo: 58,
      beatNumerator: 4,
      beatDenominator: 4,
      measures: 1000,
      selectedTrack: null, // 0/1/2...
      tracks: [
        {
          name: "track1",
          volume: 100,
          pan: 0,
          isSolo: false,
          isMute: false,
          isSelected: false,
          clips: [
            {
              id: "92SsfjamLRVdlaAtkhGnIcAsgqC3",
              fileId: "WsnLr4RpTqX9Ut8cDje3lDmSGD73",
              url: "https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3",
              name: "clip1",
              duration: 0, /////////////// 總長的時間長度
              startPoint: 5, /////////////// bars
            },
          ],
        },
        {
          name: "track2",
          volume: 100,
          pan: 0,
          isSolo: false,
          isMute: false,
          isSelected: false,
          clips: [
            {
              id: "92SsfjamLRVdlaAtkhGnIcAsgqC3",
              fileId: "WsnLr4RpTqX9Ut8cDje3lDmSGD73",
              url: "https://www.mfiles.co.uk/mp3-downloads/mozart-symphony41-3.mp3",
              name: "clip2",
              duration: 0, /////////////// 總長的時間長度
              startPoint: 1, /////////////// bars
            },
          ],
        },
      ],
    },
  ],
  files: [
    // storages
    {
      id: "WsnLr4RpTqX9Ut8cDje3lDmSGD73",
      url: "https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3",
      fileName: "fhg_bassloop_125_jzzfunk_A",
      fileType: "mp3",
      duration: 0, // timestamp
      channel: "stereo", // stereo/mono
      sampleRate: 44100, // 44.1kHz
    },
  ],
};

export default data;
