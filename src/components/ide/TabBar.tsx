"use client";

import { Lock, X } from "lucide-react";
import { clsx } from "clsx";
import type { WorkspaceFile } from "@/features/workspace/types";

interface TabBarProps {
  tabs: WorkspaceFile[];
  activeFileId: string;
  onSelectTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function TabBar({ tabs, activeFileId, onSelectTab, onCloseTab }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Open files">
      {tabs.map((file) => (
        <button
          key={file.id}
          type="button"
          role="tab"
          aria-selected={file.id === activeFileId}
          className={clsx("tab", file.id === activeFileId && "active")}
          onClick={() => onSelectTab(file.id)}
        >
          {!file.editable ? <Lock size={13} /> : null}
          <span>{file.name}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Close ${file.name}`}
            className="tab-close"
            onClick={(event) => {
              event.stopPropagation();
              onCloseTab(file.id);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onCloseTab(file.id);
              }
            }}
          >
            <X size={13} />
          </span>
        </button>
      ))}
    </div>
  );
}
