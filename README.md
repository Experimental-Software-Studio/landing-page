# Experimental Software Landing Page

This repo powers [experimental.software](https://experimental.software), a landing page presented as a small VS Code-style web workspace.

The site is intentionally a little meta: the file tree shown in the browser is generated from this codebase, and the markdown content files inside `content/` are the actual website content.

## Architecture

### App shell

The Next.js App Router entry points live in `src/app`.

- `src/app/page.tsx` renders the root route and opens `content/README.md`
- `src/app/[slug]/page.tsx` renders content routes like `/projects`, `/website`, `/about`, and `/contact`
- `src/app/layout.tsx` defines page metadata, favicons, and social cards
- `src/app/globals.css` contains the VS Code-inspired visual system

### IDE UI

The IDE emulator is built from focused components in `src/components/ide`.

- `WorkspaceShell.tsx` owns the top-level UI composition and client-side workspace session
- `ActivityBar.tsx` switches between Explorer, Search, and Source Control panels
- `FileExplorer.tsx` renders the generated project tree
- `TabBar.tsx` handles tabs, preview tabs, pinning, closing, context menus, and drag reorder
- `EditorPane.tsx` wraps the editor toolbar, markdown preview, and CodeMirror editor
- `SearchPanel.tsx`, `QuickOpen.tsx`, and `CommandPalette.tsx` emulate common VS Code workflows
- `SourceControlPanel.tsx` shows session markdown edits and generated git history

### Workspace model

Workspace state lives in `src/features/workspace`.

- `types.ts` defines the virtual file and folder model
- `workspace.ts` contains the reducer for opening files, pinning tabs, editing content, and tab behavior
- `tree.ts` builds the explorer tree from flat file data
- `contentRoutes.ts` maps content markdown files to public routes

This layer is deliberately separate from the UI so tab and file behavior can be tested without rendering React components.

### Editor

Code editing lives in `src/features/editor`.

The editor is powered by CodeMirror 6 and includes language loading, VS Code-like syntax colors, indentation guides, folding, scroll restoration, cursor position reporting, and per-file undo history.

Markdown preview rendering lives in `src/features/preview` and uses a unified remark/rehype pipeline with GitHub-flavored markdown and sanitization.

### Content

Website copy lives in `content/`.

These files are part of the real repo and are also editable during a browser session:

- `content/README.md`
- `content/PROJECTS.md`
- `content/WEBSITE.md`
- `content/ABOUT.md`
- `content/CONTACT.md`

Edits are stored only in React state. Refreshing the page resets the session.

### Generated repo mirror

The browser cannot read the repository filesystem at runtime, so the app generates a TypeScript mirror before development, tests, and builds.

- `scripts/generate-repo-mirror.ts` reads tracked project files and git history
- `scripts/repoMirrorFilter.ts` filters out unsafe or noisy files
- `generated/repoMirror.ts` contains the file data shown in the Explorer
- `generated/gitHistory.ts` contains git history for the Source Control panel

The generator keeps the site honest to the source while still avoiding secrets, dependency folders, build output, and other local noise.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Run tests:

```bash
pnpm test
```

Run lint:

```bash
pnpm lint
```

Build for production:

```bash
pnpm build
```

The `dev`, `test`, and `build` scripts all run `pnpm generate:repo` first so the in-browser file tree stays in sync with the codebase.
