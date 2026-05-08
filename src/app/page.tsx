import { WorkspaceShell } from "@/components/ide/WorkspaceShell";
import { contentPageRoutes } from "@/features/workspace/contentRoutes";

export default function Home() {
  return <WorkspaceShell initialFileId={contentPageRoutes[0].fileId} />;
}
