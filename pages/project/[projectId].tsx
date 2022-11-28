import { useRouter } from "next/router";
import { useEffect } from "react";
import AllPanels from "../../components/AllPanels";
import { useAuth } from "../../context/AuthContext";

const ProjectDetail = () => {
  const router = useRouter();
  const { projectId } = router.query;
  const { user, logout } = useAuth();

  // const [projectId, setProjectId] = useRecoilState(projectIdState);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, []);

  console.log("projectId", projectId);
  return (
    <>
      {/* <div>details {projectId}</div> */}
      <AllPanels projectId={projectId} />
    </>
  );
};

export default ProjectDetail;
