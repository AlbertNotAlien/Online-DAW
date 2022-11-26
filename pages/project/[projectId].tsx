import { useRouter } from "next/router";
import AllPanels from "../../components/AllPanels";

const ProjectDetail = () => {
  const router = useRouter();
  const { projectId } = router.query;
  // const [projectId, setProjectId] = useRecoilState(projectIdState);

  console.log("projectId", projectId);
  return (
    <>
      {/* <div>details {projectId}</div> */}
      <AllPanels projectId={projectId} />
    </>
  );
};

export default ProjectDetail;
