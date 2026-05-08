import { Files, GitBranch, Search, Settings } from "lucide-react";

export type ActivityView = "explorer" | "search" | "source-control";

interface ActivityBarProps {
  activeView: ActivityView;
  sidebarVisible: boolean;
  sourceControlCount: number;
  onSelectView: (view: ActivityView) => void;
}

export function ActivityBar({
  activeView,
  sidebarVisible,
  sourceControlCount,
  onSelectView,
}: ActivityBarProps) {
  return (
    <nav className="activity-bar" aria-label="Workspace activity">
      <button
        type="button"
        className={
          sidebarVisible && activeView === "explorer" ? "activity-button active" : "activity-button"
        }
        aria-label="Explorer"
        aria-pressed={sidebarVisible && activeView === "explorer"}
        title="Explorer"
        onClick={() => onSelectView("explorer")}
      >
        <Files size={22} />
      </button>
      <button
        type="button"
        className={
          sidebarVisible && activeView === "search" ? "activity-button active" : "activity-button"
        }
        aria-label="Search"
        aria-pressed={sidebarVisible && activeView === "search"}
        title="Search"
        onClick={() => onSelectView("search")}
      >
        <Search size={21} />
      </button>
      <button
        type="button"
        className={
          sidebarVisible && activeView === "source-control"
            ? "activity-button active"
            : "activity-button"
        }
        aria-label="Source control"
        aria-pressed={sidebarVisible && activeView === "source-control"}
        title="Source control"
        onClick={() => onSelectView("source-control")}
      >
        <GitBranch size={21} />
        {sourceControlCount > 0 ? (
          <span className="activity-badge">{sourceControlCount}</span>
        ) : null}
      </button>
      <button
        type="button"
        className="activity-button activity-settings"
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={21} />
      </button>
    </nav>
  );
}
