import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import AllPanels from "../../components/AllPanels";
import { useAuth } from "../../context/AuthContext";
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
  ClipData,
} from "../../context/atoms";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";

const ProjectDetail = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, logout } = useAuth();
  const projectData = useRecoilValue(projectDataState);

  // const [projectId, setProjectId] = useRecoilState(projectIdState);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, []);

  console.log("projectId", projectId);
  return (
    <>
      <Head>
        <title>{`${projectData.name} - ${user.displayName} | Online DAW`}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AllPanels projectId={projectId} />
    </>
  );
};

export default ProjectDetail;
