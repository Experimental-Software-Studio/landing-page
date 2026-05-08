import { Command } from "lucide-react";

interface CommandPaletteHintProps {
  onOpen: () => void;
}

export function CommandPaletteHint({ onOpen }: CommandPaletteHintProps) {
  return (
    <button type="button" className="command-hint" aria-label="Open quick file search" onClick={onOpen}>
      <Command size={15} />
      <span>Search files</span>
    </button>
  );
}
