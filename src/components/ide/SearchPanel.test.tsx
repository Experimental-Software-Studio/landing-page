import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SearchPanel } from "./SearchPanel";
import type { WorkspaceFile } from "@/features/workspace/types";

const files: Array<WorkspaceFile & { currentContent: string }> = [
  {
    id: "repo:content/README.md",
    path: "content/README.md",
    name: "README.md",
    extension: "md",
    content: "# README",
    currentContent: "This landing page has editable markdown.",
    editable: true,
    source: "content",
    renderer: "markdown",
    language: "markdown",
  },
  {
    id: "repo:src/app/globals.css",
    path: "src/app/globals.css",
    name: "globals.css",
    extension: "css",
    content: "",
    currentContent: ".search-input { letter-spacing: 0; }",
    editable: false,
    source: "repo",
    renderer: "code",
    language: "css",
  },
];

function SearchPanelHarness({
  onOpenMatch = vi.fn(),
}: {
  onOpenMatch?: (fileId: string, lineNumber: number) => void;
}) {
  const [query, setQuery] = useState("");

  return (
    <SearchPanel files={files} query={query} onQueryChange={setQuery} onOpenMatch={onOpenMatch} />
  );
}

describe("SearchPanel", () => {
  it("searches file contents and opens a matching file", async () => {
    const user = userEvent.setup();
    const onOpenMatch = vi.fn();

    render(<SearchPanelHarness onOpenMatch={onOpenMatch} />);

    await user.type(screen.getByRole("textbox", { name: "Search files" }), "editable");
    expect(screen.getByText("1 result in 1 file")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();

    await user.click(screen.getByText(/editable/));

    expect(onOpenMatch).toHaveBeenCalledWith("repo:content/README.md", 1);
  });

  it("collapses result groups from the file row", async () => {
    const user = userEvent.setup();

    render(
      <SearchPanel
        files={files}
        query="editable"
        onQueryChange={vi.fn()}
        onOpenMatch={vi.fn()}
      />,
    );

    expect(screen.getByText(/editable/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /README.md/ }));

    expect(screen.queryByText(/editable/)).not.toBeInTheDocument();
  });
});
