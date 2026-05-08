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
  modifiedFileIds?: Set<string>;
  onSelectTab: (fileId: string) => void;
  onPinTab: (fileId: string) => void;
  onCloseTab: (fileId: string) => void;
  onCloseOtherTabs: (fileId: string) => void;
  onCloseTabsToRight: (fileId: string) => void;
  onReorderTab: (fileId: string, targetIndex: number) => void;
}

interface TabContextMenuState {
  fileId: string;
  x: number;
  y: number;
}

interface DropIndicatorState {
  fileId: string;
  side: "before" | "after";
  targetIndex: number;
}

export function TabBar({
  tabs,
  activeFileId,
  previewTabId,
  modifiedFileIds = new Set(),
  onSelectTab,
  onPinTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseTabsToRight,
  onReorderTab,
}: TabBarProps) {
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicatorState | null>(null);
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
      <div
        className="tab-bar"
        role="tablist"
        aria-label="Open files"
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDropIndicator(null);
          }
        }}
        onDragOver={(event) => {
          if (!draggedFileId) {
            return;
          }

          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();

          if (draggedFileId && dropIndicator) {
            onReorderTab(draggedFileId, dropIndicator.targetIndex);
          }

          setDraggedFileId(null);
          setDropIndicator(null);
        }}
      >
        {tabs.map((file, index) => {
          const modified = modifiedFileIds.has(file.id);

          return (
            <button
              key={file.id}
              type="button"
              role="tab"
              draggable
              aria-selected={file.id === activeFileId}
              className={clsx(
                "tab",
                file.id === activeFileId && "active",
                file.id === previewTabId && "preview",
                file.id === draggedFileId && "dragging",
                modified && "modified",
                dropIndicator?.fileId === file.id &&
                  (dropIndicator.side === "before" ? "drop-before" : "drop-after"),
              )}
              onPointerDown={() => onSelectTab(file.id)}
              onClick={() => onSelectTab(file.id)}
              onDoubleClick={() => onPinTab(file.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({ fileId: file.id, x: event.clientX, y: event.clientY });
              }}
              onDragStart={(event) => {
                setDraggedFileId(file.id);
                setContextMenu(null);
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", file.id);

                const dragPreview = event.currentTarget.cloneNode(true) as HTMLElement;
                dragPreview.classList.add("tab-drag-preview");
                event.currentTarget.ownerDocument.body.append(dragPreview);
                event.dataTransfer.setDragImage(dragPreview, 0, 0);

                requestAnimationFrame(() => {
                  dragPreview.remove();
                });
              }}
              onDragEnd={() => {
                setDraggedFileId(null);
                setDropIndicator(null);
              }}
              onDragOver={(event) => {
                if (!draggedFileId || draggedFileId === file.id) {
                  return;
                }

                event.preventDefault();

                const rect = event.currentTarget.getBoundingClientRect();
                const side = event.clientX < rect.left + rect.width / 2 ? "before" : "after";
                const targetIndex = side === "before" ? index : index + 1;

                setDropIndicator({ fileId: file.id, side, targetIndex });
              }}
            >
              <SetiFileIcon fileName={file.name} />
              <span className="tab-label">{file.name}</span>
              {modified ? <span className="tab-status">M</span> : null}
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
          );
        })}
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
