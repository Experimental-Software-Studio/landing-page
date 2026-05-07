import { Command } from "lucide-react";

export function CommandPaletteHint() {
  return (
    <div className="command-hint" aria-label="Command palette placeholder">
      <Command size={15} />
      <span>Quick Open is coming soon</span>
    </div>
  );
}
