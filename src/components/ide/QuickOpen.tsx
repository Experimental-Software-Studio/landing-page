"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SetiFileIcon } from "./SetiFileIcon";
import type { WorkspaceFile } from "@/features/workspace/types";

interface QuickOpenProps {
  files: WorkspaceFile[];
  activeFileId: string;
  onClose: () => void;
  onOpenFile: (fileId: string) => void;
}

function getDirectory(path: string) {
  const lastSlash = path.lastIndexOf("/");

  return lastSlash === -1 ? "" : path.slice(0, lastSlash);
}

function matchesQuery(file: WorkspaceFile, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();

  return (
    file.name.toLowerCase().includes(normalizedQuery) ||
    file.path.toLowerCase().includes(normalizedQuery)
  );
}

export function QuickOpen({ files, activeFileId, onClose, onOpenFile }: QuickOpenProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filteredFiles = useMemo(
    () => files.filter((file) => matchesQuery(file, query)).slice(0, 14),
    [files, query],
  );
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredFiles.length - 1));
  const selectedFile = filteredFiles[safeSelectedIndex];

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const openSelectedFile = () => {
    if (!selectedFile) {
      return;
    }

    onOpenFile(selectedFile.id);
    onClose();
  };

  return (
    <div className="quick-open-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="quick-open"
        role="dialog"
        aria-modal="true"
        aria-label="Search files by name"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <input
          ref={inputRef}
          className="quick-open-input"
          value={query}
          placeholder="Search files by name"
          aria-label="Search files by name"
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              onClose();
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setSelectedIndex((current) =>
                Math.min(Math.max(0, filteredFiles.length - 1), current + 1),
              );
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setSelectedIndex((current) => Math.max(0, current - 1));
            }

            if (event.key === "Enter") {
              event.preventDefault();
              openSelectedFile();
            }
          }}
        />
        <div className="quick-open-list" role="listbox" aria-label="Matching files">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file, index) => {
              const selected = index === safeSelectedIndex;

              return (
                <button
                  key={file.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={selected ? "quick-open-item active" : "quick-open-item"}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    onOpenFile(file.id);
                    onClose();
                  }}
                >
                  <SetiFileIcon fileName={file.name} />
                  <span className="quick-open-name">{file.name}</span>
                  <span className="quick-open-path">{getDirectory(file.path)}</span>
                  {file.id === activeFileId ? (
                    <span className="quick-open-meta">active</span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="quick-open-empty">No matching files</div>
          )}
        </div>
      </section>
    </div>
  );
}
