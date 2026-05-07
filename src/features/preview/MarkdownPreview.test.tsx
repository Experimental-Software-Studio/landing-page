import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownPreview } from "./MarkdownPreview";

describe("MarkdownPreview", () => {
  it("renders edited markdown content", () => {
    render(<MarkdownPreview markdown="# Edited title" />);

    expect(screen.getByRole("heading", { name: "Edited title" })).toBeInTheDocument();
  });
});
