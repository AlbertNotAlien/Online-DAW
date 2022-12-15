import { SetStateAction } from "react";
import { RecoilRoot } from "recoil";
import NotesPanel from "../components/PianoRoll/NotesPanel";
import { hoverMidiInfo } from "../store/atoms";

export default {
  title: "PianoRoll/NotesPanel",
  component: NotesPanel,
};

export const NotesP = (
  <>
    <RecoilRoot>
      <NotesPanel
        NOTATIONS={[]}
        selectedTrackIndex={0}
        setHoverNote={function (
          value: SetStateAction<hoverMidiInfo | null>
        ): void {
          throw new Error("Function not implemented.");
        }}
      />
    </RecoilRoot>
  </>
);
