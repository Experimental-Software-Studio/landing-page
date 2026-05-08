"use client";

import { Settings } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CommandPaletteCommand {
  id: string;
  label: string;
  detail?: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: CommandPaletteCommand[];
  onClose: () => void;
}

function matchesCommand(command: CommandPaletteCommand, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = query.toLowerCase();

  return (
    command.label.toLowerCase().includes(normalizedQuery) ||
    command.detail?.toLowerCase().includes(normalizedQuery)
  );
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const filteredCommands = useMemo(
    () => commands.filter((command) => matchesCommand(command, query)).slice(0, 14),
    [commands, query],
  );
  const safeSelectedIndex = Math.min(selectedIndex, Math.max(0, filteredCommands.length - 1));
  const selectedCommand = filteredCommands[safeSelectedIndex];

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const runSelectedCommand = () => {
    if (!selectedCommand) {
      return;
    }

    selectedCommand.run();
    onClose();
  };

  return (
    <div className="quick-open-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="quick-open command-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Run command"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-palette-input-wrap">
          <span className="command-palette-prefix" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={inputRef}
            className="quick-open-input command-palette-input"
            value={query}
            placeholder="Type a command"
            aria-label="Type a command"
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
                  Math.min(Math.max(0, filteredCommands.length - 1), current + 1),
                );
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setSelectedIndex((current) => Math.max(0, current - 1));
              }

              if (event.key === "Enter") {
                event.preventDefault();
                runSelectedCommand();
              }
            }}
          />
        </div>
        <div className="quick-open-list" role="listbox" aria-label="Matching commands">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => {
              const selected = index === safeSelectedIndex;

              return (
                <button
                  key={command.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={
                    selected ? "quick-open-item command-item active" : "quick-open-item command-item"
                  }
                  onMouseEnter={() => setSelectedIndex(index)}
                  onClick={() => {
                    command.run();
                    onClose();
                  }}
                >
                  <Settings size={15} />
                  <span className="quick-open-name">{command.label}</span>
                  {command.detail ? (
                    <span className="quick-open-path">{command.detail}</span>
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="quick-open-empty">No matching commands</div>
          )}
        </div>
      </section>
    </div>
  );
}
