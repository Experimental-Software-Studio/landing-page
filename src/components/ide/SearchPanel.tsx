"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SetiFileIcon } from "./SetiFileIcon";
import type { WorkspaceFile } from "@/features/workspace/types";

interface SearchableFile extends WorkspaceFile {
  currentContent: string;
}

interface SearchPanelProps {
  files: SearchableFile[];
  query: string;
  onQueryChange: (query: string) => void;
  onOpenMatch: (fileId: string, lineNumber: number) => void;
}

interface SearchMatch {
  id: string;
  lineNumber: number;
  before: string;
  match: string;
  after: string;
}

interface SearchResult {
  file: SearchableFile;
  matches: SearchMatch[];
}

const maxMatchesPerFile = 20;
const snippetRadius = 28;

function getSearchResults(files: SearchableFile[], query: string): SearchResult[] {
  const trimmedQuery = query.trim();
  const normalizedQuery = trimmedQuery.toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return files
    .map((file) => {
      const matches: SearchMatch[] = [];
      const lines = file.currentContent.split("\n");

      for (const [lineIndex, line] of lines.entries()) {
        let searchFrom = 0;
        const normalizedLine = line.toLowerCase();

        while (matches.length < maxMatchesPerFile) {
          const matchIndex = normalizedLine.indexOf(normalizedQuery, searchFrom);

          if (matchIndex === -1) {
            break;
          }

          const start = Math.max(0, matchIndex - snippetRadius);
          const end = Math.min(line.length, matchIndex + trimmedQuery.length + snippetRadius);

          matches.push({
            id: `${file.id}:${lineIndex}:${matchIndex}`,
            lineNumber: lineIndex + 1,
            before: `${start > 0 ? "..." : ""}${line.slice(start, matchIndex)}`,
            match: line.slice(matchIndex, matchIndex + trimmedQuery.length),
            after: `${line.slice(matchIndex + trimmedQuery.length, end)}${end < line.length ? "..." : ""}`,
          });

          searchFrom = matchIndex + normalizedQuery.length;
        }

        if (matches.length >= maxMatchesPerFile) {
          break;
        }
      }

      return { file, matches };
    })
    .filter((result) => result.matches.length > 0);
}

function getContainingPath(file: SearchableFile) {
  const pathParts = file.path.split("/");

  return pathParts.slice(0, -1).join("/");
}

export function SearchPanel({ files, query, onQueryChange, onOpenMatch }: SearchPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [collapsedFileIds, setCollapsedFileIds] = useState<Set<string>>(() => new Set());
  const results = useMemo(() => getSearchResults(files, query), [files, query]);
  const matchCount = results.reduce((count, result) => count + result.matches.length, 0);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toggleResultGroup = (fileId: string) => {
    setCollapsedFileIds((current) => {
      const next = new Set(current);

      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }

      return next;
    });
  };

  return (
    <aside className="search-panel" aria-label="Search">
      <div className="search-title">Search</div>
      <div className="search-input-row">
        <input
          ref={inputRef}
          className="search-input"
          value={query}
          placeholder="Search"
          aria-label="Search files"
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </div>
      <div className="search-results" aria-live="polite">
        {query.trim() ? (
          <div className="search-summary">
            {matchCount} {matchCount === 1 ? "result" : "results"} in {results.length}{" "}
            {results.length === 1 ? "file" : "files"}
          </div>
        ) : null}
        {results.map((result) => (
          <section key={result.file.id} className="search-result-group">
            <button
              type="button"
              className="search-result-file"
              aria-expanded={!collapsedFileIds.has(result.file.id)}
              onClick={() => toggleResultGroup(result.file.id)}
            >
              <ChevronDown
                className={
                  collapsedFileIds.has(result.file.id)
                    ? "search-result-chevron collapsed"
                    : "search-result-chevron"
                }
                size={15}
              />
              <SetiFileIcon fileName={result.file.name} />
              <span className="search-result-name">{result.file.name}</span>
              <span className="search-result-path">{getContainingPath(result.file)}</span>
              <span className="search-result-count">{result.matches.length}</span>
            </button>
            {!collapsedFileIds.has(result.file.id) ? (
              <div>
                {result.matches.map((match) => (
                  <button
                    key={match.id}
                    type="button"
                    className="search-match-row"
                    onClick={() => onOpenMatch(result.file.id, match.lineNumber)}
                  >
                    <span className="search-match-text">
                      {match.before}
                      <mark>{match.match}</mark>
                      {match.after}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
    </aside>
  );
}
