import type { WorkspaceFile } from "@/features/workspace/types";

export const contentFiles: WorkspaceFile[] = [
  {
    id: "content-readme",
    path: "workspace/README.md",
    name: "README.md",
    extension: "md",
    language: "markdown",
    renderer: "markdown",
    editable: true,
    source: "content",
    content: `# Experimental Software Studio

This landing page is a tiny workspace. The files are the story, the editor is the interface, and the page is honest about being built out of the same pieces it shows.

Try changing this sentence, then switch to Preview.

## What this is

- A VS Code-inspired landing page
- An editable markdown document system
- A readable open-source codebase
- A place to make technical peers pause for a second

## What this is not

This is not a cloud IDE, a terminal emulator, or a package runner. It is a focused browser workspace for narrative, source browsing, and small acts of interaction.
`,
  },
  {
    id: "content-philosophy",
    path: "workspace/philosophy.md",
    name: "philosophy.md",
    extension: "md",
    language: "markdown",
    renderer: "markdown",
    editable: true,
    source: "content",
    content: `# Philosophy

The site should feel like software, not a brochure wearing software clothes.

Good constraints for this project:

| Principle | Meaning |
| --- | --- |
| Real interactions | If a control exists, it should do something coherent. |
| Small interfaces | Components should accept narrow, typed inputs. |
| Source-visible | The project should make its own construction inspectable. |
| Session-safe | Edits can be playful because they do not persist. |

The best version of this page feels like opening a project that happens to explain itself.
`,
  },
  {
    id: "content-roadmap",
    path: "workspace/roadmap.md",
    name: "roadmap.md",
    extension: "md",
    language: "markdown",
    renderer: "markdown",
    editable: true,
    source: "content",
    content: `# Roadmap

## v1

- Editable markdown content files
- Read-only mirrored source files
- Code and Preview modes
- VS Code-like shell
- Mobile-friendly navigation

## Later

- Command palette
- Search across files
- Shareable sessions
- Multiple themes
- Optional live preview experiments
`,
  },
  {
    id: "content-contributing",
    path: "workspace/contributing.md",
    name: "contributing.md",
    extension: "md",
    language: "markdown",
    renderer: "markdown",
    editable: true,
    source: "content",
    content: `# Contributing

This project should stay pleasant to read.

Before adding a feature, look for the narrowest interface that can support it:

\`\`\`ts
type GoodComponent = (props: SpecificProps) => JSX.Element;
\`\`\`

Useful contributions:

- Cleaner workspace state transitions
- Better keyboard support
- Thoughtful markdown files
- Accessibility improvements
- Small visual refinements that preserve the IDE metaphor
`,
  },
  {
    id: "content-contact",
    path: "workspace/contact.md",
    name: "contact.md",
    extension: "md",
    language: "markdown",
    renderer: "markdown",
    editable: true,
    source: "content",
    content: `# Contact

This is intentionally written as a file because the whole site is a project.

- GitHub: Experimental Software Studio
- Notes: open an issue when the repo is public
- Best first contribution: improve a content file or add a focused component test
`,
  },
];
