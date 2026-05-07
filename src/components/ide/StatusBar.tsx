import { GitBranch, Lock, Pencil } from "lucide-react";
import type { WorkspaceFile } from "@/features/workspace/types";

interface StatusBarProps {
  file: WorkspaceFile;
  mode: string;
  openCount: number;
}

export function StatusBar({ file, mode, openCount }: StatusBarProps) {
  return (
    <footer className="status-bar">
      <span className="status-item">
        <GitBranch size={14} />
        main
      </span>
      <span className="status-item">{file.path}</span>
      <span className="status-spacer" />
      <span className="status-item">{openCount} open</span>
      <span className="status-item">{mode}</span>
      <span className="status-item">
        {file.editable ? <Pencil size={14} /> : <Lock size={14} />}
        {file.editable ? "Session edit" : "Read-only"}
      </span>
    </footer>
  );
}
