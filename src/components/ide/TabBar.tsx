"use client";

import { X } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";
import { SetiFileIcon } from "./SetiFileIcon";
import type { WorkspaceFile } from "@/features/workspace/types";

interface TabBarProps {
  tabs: WorkspaceFile[];
  activeFileId: string;
  previewTabId: string | null;
  onSelectTab: (fileId: string) => void;
  onPinTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onCloseOtherTabs: (fileId: string) => void;
  onCloseTabsToRight: (fileId: string) => void;
}

interface TabContextMenuState {
  fileId: string;
  x: number;
  y: number;
}

export function TabBar({
  tabs,
  activeFileId,
  previewTabId,
  onSelectTab,
  onPinTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseTabsToRight,
}: TabBarProps) {
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null);
  const contextFile = contextMenu ? tabs.find((tab) => tab.id === contextMenu.fileId) : null;
  const contextFileIndex = contextFile ? tabs.findIndex((tab) => tab.id === contextFile.id) : -1;
  const hasTabsToRight = contextFileIndex >= 0 && contextFileIndex < tabs.length - 1;

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeMenu = () => setContextMenu(null);

    window.addEventListener("click", closeMenu);
    window.addEventListener("blur", closeMenu);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("blur", closeMenu);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [contextMenu]);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [contextMenu]);

  const runMenuAction = (action: (fileId: string) => void) => {
    if (!contextMenu) {
      return;
    }

    action(contextMenu.fileId);
    setContextMenu(null);
  };

  return (
    <>
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
            onContextMenu={(event) => {
              event.preventDefault();
              setContextMenu({ fileId: file.id, x: event.clientX, y: event.clientY });
            }}
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

      {contextMenu && contextFile ? (
        <div
          className="tab-context-menu"
          role="menu"
          aria-label={`${contextFile.name} tab actions`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            aria-label="Close"
            onClick={() => runMenuAction(onCloseTab)}
          >
            <span>Close</span>
            <span className="tab-context-shortcut">⌘W</span>
          </button>
          <button
            type="button"
            role="menuitem"
            aria-label="Close Others"
            onClick={() => runMenuAction(onCloseOtherTabs)}
          >
            <span>Close Others</span>
            <span className="tab-context-shortcut">⌥⌘T</span>
          </button>
          <button
            type="button"
            role="menuitem"
            aria-label="Close to the Right"
            disabled={!hasTabsToRight}
            onClick={() => runMenuAction(onCloseTabsToRight)}
          >
            <span>Close to the Right</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
