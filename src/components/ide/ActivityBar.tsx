import { Files, GitBranch, Search, Settings } from "lucide-react";

export function ActivityBar() {
  return (
    <nav className="activity-bar" aria-label="Workspace activity">
      <button className="activity-button active" aria-label="Explorer" title="Explorer">
        <Files size={22} />
      </button>
      <button className="activity-button" aria-label="Search" title="Search">
        <Search size={21} />
      </button>
      <button className="activity-button" aria-label="Source control" title="Source control">
        <GitBranch size={21} />
      </button>
      <button className="activity-button activity-settings" aria-label="Settings" title="Settings">
        <Settings size={21} />
      </button>
    </nav>
  );
}
