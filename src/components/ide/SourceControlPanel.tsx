"use client";

import {
  ChevronDown,
  GitBranch,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { SetiFileIcon } from "./SetiFileIcon";
import type { GitHistoryCommit } from "@/features/git/types";
import type { WorkspaceFile } from "@/features/workspace/types";

interface SourceControlPanelProps {
  changedFiles: WorkspaceFile[];
  commits: GitHistoryCommit[];
  branchName: string;
  githubUrl: string;
  onOpenFile: (fileId: string) => void;
}

function containingPath(file: WorkspaceFile) {
  const pathParts = file.path.split("/");

  return pathParts.slice(0, -1).join("/");
}

function refLabel(refs: string[]) {
  return refs.find((ref) => ref === "HEAD") ?? refs.find((ref) => ref.includes("/")) ?? refs[0];
}

function GitHubMark() {
  return (
    <svg
      aria-hidden="true"
      className="source-github-mark"
      viewBox="0 0 24 24"
    >
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.27-5.23-5.67 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18.92-.26 1.9-.38 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.8 1.19 1.83 1.19 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.14v3.16c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}

interface SectionHeaderProps {
  count?: number;
  icon?: LucideIcon;
  isOpen: boolean;
  label: string;
  onToggle: () => void;
}

function SectionHeader({ count, icon: Icon, isOpen, label, onToggle }: SectionHeaderProps) {
  return (
    <button
      type="button"
      className="source-section-heading"
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <ChevronDown
        className={isOpen ? "source-section-chevron" : "source-section-chevron closed"}
        size={16}
      />
      <span>{label}</span>
      {typeof count === "number" ? <span className="source-count">{count}</span> : null}
      {Icon ? <Icon className="source-section-icon" size={15} /> : null}
    </button>
  );
}

export function SourceControlPanel({
  changedFiles,
  commits,
  branchName,
  githubUrl,
  onOpenFile,
}: SourceControlPanelProps) {
  const [changesOpen, setChangesOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [changesHeight, setChangesHeight] = useState(240);
  const [isResizeHandleHoverActive, setIsResizeHandleHoverActive] = useState(false);
  const resizeHoverTimerRef = useRef<number | null>(null);
  const clearResizeHoverTimer = useCallback(() => {
    if (resizeHoverTimerRef.current === null) {
      return;
    }

    window.clearTimeout(resizeHoverTimerRef.current);
    resizeHoverTimerRef.current = null;
  }, []);
  const showResizeHoverAfterDelay = useCallback(() => {
    clearResizeHoverTimer();
    resizeHoverTimerRef.current = window.setTimeout(() => {
      setIsResizeHandleHoverActive(true);
      resizeHoverTimerRef.current = null;
    }, 350);
  }, [clearResizeHoverTimer]);
  const hideResizeHover = useCallback(() => {
    clearResizeHoverTimer();
    setIsResizeHandleHoverActive(false);
  }, [clearResizeHoverTimer]);
  const resizeChangesHeight = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();

    const body = event.currentTarget.ownerDocument.body;
    const panel = event.currentTarget.closest(".source-panel");
    const changesSection = event.currentTarget.previousElementSibling;
    const panelRect = panel?.getBoundingClientRect();
    const changesRect = changesSection?.getBoundingClientRect();

    if (!panelRect || !changesRect) {
      return;
    }

    const minChangesHeight = 72;
    const minHistoryHeight = 96;
    const resizerHeight = event.currentTarget.getBoundingClientRect().height;
    const maxChangesHeight = Math.max(
      minChangesHeight,
      panelRect.bottom - changesRect.top - resizerHeight - minHistoryHeight,
    );

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const nextHeight = moveEvent.clientY - changesRect.top - resizerHeight / 2;

      setChangesHeight(Math.min(maxChangesHeight, Math.max(minChangesHeight, nextHeight)));
    };
    const stopResize = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
      body.classList.remove("is-resizing-source-panel");
    };

    clearResizeHoverTimer();
    setIsResizeHandleHoverActive(true);
    body.classList.add("is-resizing-source-panel");
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  }, [clearResizeHoverTimer]);

  useEffect(() => clearResizeHoverTimer, [clearResizeHoverTimer]);

  return (
    <aside
      className="source-panel"
      aria-label="Source control"
      style={{ "--source-changes-height": `${changesHeight}px` } as CSSProperties}
    >
      <div className="source-title-row">
        <div className="source-title">Source Control</div>
        <button type="button" className="source-icon-button" aria-label="More source actions">
          <MoreHorizontal size={16} />
        </button>
      </div>

      <div className="source-action-row">
        <a className="source-github-button" href={githubUrl} target="_blank" rel="noreferrer">
          <GitHubMark />
          <span>Open in GitHub</span>
        </a>
      </div>

      <section className="source-changes-section" aria-label="Changes">
        <SectionHeader
          count={changedFiles.length}
          isOpen={changesOpen}
          label="Changes"
          onToggle={() => setChangesOpen((open) => !open)}
        />
        {changesOpen ? (
          changedFiles.length > 0 ? (
            <div className="source-file-list">
              {changedFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  className="source-file-row"
                  onClick={() => onOpenFile(file.id)}
                >
                  <SetiFileIcon fileName={file.name} />
                  <span className="source-file-name">{file.name}</span>
                  <span className="source-file-path">{containingPath(file)}</span>
                  <span className="source-file-status">M</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="source-empty">No changes</div>
          )
        ) : null}
      </section>

      <div
        className="source-panel-resizer"
        data-hover-active={isResizeHandleHoverActive}
        role="separator"
        aria-label="Resize source control sections"
        aria-orientation="horizontal"
        onPointerDown={resizeChangesHeight}
        onPointerEnter={showResizeHoverAfterDelay}
        onPointerLeave={hideResizeHover}
        onBlur={hideResizeHover}
      />

      <section className="source-history-section" aria-label="Git history">
        <SectionHeader
          icon={GitBranch}
          isOpen={historyOpen}
          label="Git History"
          onToggle={() => setHistoryOpen((open) => !open)}
        />
        {historyOpen ? (
          <div className="source-history-list">
            <div className="source-history-row source-history-current">
              <span className="source-history-node current" />
              <span className="source-history-subject">Outgoing Changes</span>
              <span className="source-history-muted">{branchName}</span>
            </div>
            {commits.map((commit) => {
              const label = refLabel(commit.refs);

              return (
                <div key={commit.hash} className="source-history-row">
                  <span className="source-history-node" />
                  <span className="source-history-subject" title={commit.subject}>
                    {commit.subject}
                  </span>
                  <span className="source-history-muted">{commit.author}</span>
                  {label ? <span className="source-ref-label">{label}</span> : null}
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </aside>
  );
}
