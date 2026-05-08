import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CommandPalette, type CommandPaletteCommand } from "./CommandPalette";

function renderCommandPalette(overrides: Partial<{ commands: CommandPaletteCommand[] }> = {}) {
  const openGitHub = vi.fn();
  const openReadme = vi.fn();
  const commands: CommandPaletteCommand[] = [
    {
      id: "github.open-repository",
      label: "GitHub: Open Repository",
      detail: "Experimental-Software-Studio/landing-page",
      run: openGitHub,
    },
    {
      id: "file.open-readme",
      label: "File: Open README",
      detail: "content/README.md",
      run: openReadme,
    },
  ];
  const onClose = vi.fn();

  render(<CommandPalette commands={overrides.commands ?? commands} onClose={onClose} />);

  return { onClose, openGitHub, openReadme };
}

describe("CommandPalette", () => {
  it("filters commands and runs the selected command", async () => {
    const user = userEvent.setup();
    const { onClose, openGitHub } = renderCommandPalette();

    await user.type(screen.getByRole("textbox", { name: "Type a command" }), "github");
    await user.keyboard("{Enter}");

    expect(openGitHub).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses arrow keys to change the selected command", async () => {
    const user = userEvent.setup();
    const { openReadme } = renderCommandPalette();

    screen.getByRole("textbox", { name: "Type a command" }).focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(openReadme).toHaveBeenCalledOnce();
  });

  it("closes on escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderCommandPalette();

    screen.getByRole("textbox", { name: "Type a command" }).focus();
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });
});
