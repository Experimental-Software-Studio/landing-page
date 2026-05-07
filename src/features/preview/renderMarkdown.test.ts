import { describe, expect, it } from "vitest";
import { renderMarkdown } from "./renderMarkdown";

describe("renderMarkdown", () => {
  it("renders common GitHub-flavored markdown", () => {
    const html = renderMarkdown(`# Title

| One | Two |
| --- | --- |
| A | B |

\`\`\`ts
const value = 1;
\`\`\`
`);

    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<table>");
    expect(html).toContain("const value = 1;");
  });

  it("sanitizes unsafe HTML", () => {
    const html = renderMarkdown(`<script>alert("x")</script>

<img src=x onerror=alert("x")>
`);

    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
  });
});
