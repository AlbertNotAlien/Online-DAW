import WaveSurfer from "wavesurfer.js";
import CursorPlugin from "wavesurfer.js/dist/plugin/wavesurfer.cursor.js";
import Timeline from "wavesurfer.js/dist/plugin/wavesurfer.timeline.js";
import Regions from "wavesurfer.js/dist/plugin/wavesurfer.regions.js";

const TimelineTest = () => {
  name: "Details",
  // components: { MyWaveSurfer },
  data() {
    return {
      wavesurfer: null,
    };
  },
  mounted() {
    this.$nextTick(() => {
      console.log(WaveSurfer);
      this.wavesurfer = WaveSurfer.create({
        // 应该在其中绘制波形的CSS选择器或HTML元素。这是唯一必需的参数。
        container: this.$refs.waveform,
        // 光标的填充颜色，指示播放头的位置。
        cursorColor: "red",
        // 更改波形容器的背景颜色。
        // backgroundColor: 'gray',
        // 光标后的波形填充颜色。
        waveColor: "violet",
        // 光标后面的波形部分的填充色。当progressColor和waveColor相同时，完全不渲染进度波
        progressColor: "purple",
        backend: "MediaElement",
        // 音频播放时间轴
        mediaControls: false,
        // 播放音频的速度
        audioRate: "1",
        // 插件：此教程配置了光标插件和时间轴插件
        plugins: [
          // 时间轴插件
          Timeline.create({
            container: "#wave-timeline",
          }),
        ],
      });
      this.wavesurfer.on("error", function (e) {
        console.warn(e);
      });
      this.wavesurfer.load(require("./peaks/sample.mp3"));
    });
  },
  methods: {
    // 播放时暂停，播放时暂停
    plays() {
      this.wavesurfer.playPause();
    },
  },
};

export default TimelineTest;
/*

{
  /* <style scoped>
.mixin-components-container {
  background-color: #f0f2f5;
  padding: 30px;
  min-height: calc(100vh - 84px);
}
</style> */
}
