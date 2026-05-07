"use client";

import { X } from "lucide-react";
import { clsx } from "clsx";
import { SetiFileIcon } from "./SetiFileIcon";
import type { WorkspaceFile } from "@/features/workspace/types";

interface TabBarProps {
  tabs: WorkspaceFile[];
  activeFileId: string;
  previewTabId: string | null;
  onSelectTab: (fileId: string) => void;
  onPinTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
}

export function TabBar({
  tabs,
  activeFileId,
  previewTabId,
  onSelectTab,
  onPinTab,
  onCloseTab,
}: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Open files">
      {tabs.map((file) => (
        <button
          key={file.id}
          type="button"
          role="tab"
          aria-selected={file.id === activeFileId}
          className={clsx(
            "tab",
            file.id === activeFileId && "active",
            file.id === previewTabId && "preview",
          )}
          onClick={() => onSelectTab(file.id)}
          onDoubleClick={() => onPinTab(file.id)}
        >
          <SetiFileIcon fileName={file.name} />
          <span className="tab-label">{file.name}</span>
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
