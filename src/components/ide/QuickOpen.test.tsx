import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuickOpen } from "./QuickOpen";
import type { WorkspaceFile } from "@/features/workspace/types";

const files: WorkspaceFile[] = [
  {
    id: "repo:content/README.md",
    path: "content/README.md",
    name: "README.md",
    extension: "md",
    content: "# README",
    editable: true,
    source: "content",
    renderer: "markdown",
    language: "markdown",
  },
  {
    id: "repo:src/components/ide/TabBar.tsx",
    path: "src/components/ide/TabBar.tsx",
    name: "TabBar.tsx",
    extension: "tsx",
    content: "export function TabBar() {}",
    editable: false,
    source: "repo",
    renderer: "code",
    language: "typescript",
  },
  {
    id: "repo:package.json",
    path: "package.json",
    name: "package.json",
    extension: "json",
    content: "{}",
    editable: false,
    source: "repo",
    renderer: "code",
    language: "json",
  },
];

describe("QuickOpen", () => {
  it("filters files and opens the selected result", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onOpenFile = vi.fn();

    render(
      <QuickOpen
        files={files}
        activeFileId={files[0].id}
        onClose={onClose}
        onOpenFile={onOpenFile}
      />,
    );

    await user.type(screen.getByRole("textbox", { name: "Search files by name" }), "tab");
    await user.keyboard("{Enter}");

    expect(onOpenFile).toHaveBeenCalledWith("repo:src/components/ide/TabBar.tsx");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses arrow keys to change the selected result", async () => {
    const user = userEvent.setup();
    const onOpenFile = vi.fn();

    render(
      <QuickOpen
        files={files}
        activeFileId={files[0].id}
        onClose={vi.fn()}
        onOpenFile={onOpenFile}
      />,
    );

    screen.getByRole("textbox", { name: "Search files by name" }).focus();
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onOpenFile).toHaveBeenCalledWith("repo:src/components/ide/TabBar.tsx");
  });

  it("closes on escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <QuickOpen
        files={files}
        activeFileId={files[0].id}
        onClose={onClose}
        onOpenFile={vi.fn()}
      />,
    );

    screen.getByRole("textbox", { name: "Search files by name" }).focus();
    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledOnce();
  });
});
