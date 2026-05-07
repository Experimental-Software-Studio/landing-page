import type { WorkspaceFile, WorkspaceFolder, WorkspaceNode } from "./types";

interface MutableFolder {
  id: string;
  path: string;
  name: string;
  folders: Map<string, MutableFolder>;
  files: WorkspaceFile[];
}

function createFolder(path: string, name: string): MutableFolder {
  return {
    id: `folder:${path || "root"}`,
    path,
    name,
    folders: new Map(),
    files: [],
  };
}

function toImmutableFolder(folder: MutableFolder): WorkspaceFolder {
  const folderWeight = (name: string) => {
    if (name === "workspace") return 0;
    if (name === "repo") return 1;
    return 2;
  };

  const children: WorkspaceNode[] = [
    ...Array.from(folder.folders.values())
      .sort(
        (a, b) => folderWeight(a.name) - folderWeight(b.name) || a.name.localeCompare(b.name),
      )
      .map(toImmutableFolder),
    ...folder.files.sort((a, b) => a.name.localeCompare(b.name)),
  ];

  return {
    id: folder.id,
    path: folder.path,
    name: folder.name,
    children,
  };
}

export function buildWorkspaceTree(files: WorkspaceFile[]): WorkspaceFolder {
  const root = createFolder("", "EXPERIMENTAL-SOFTWARE-STUDIO");

  for (const file of files) {
    const segments = file.path.split("/");
    const fileName = segments.pop();

    if (!fileName) {
      continue;
    }

    let current = root;

    for (const segment of segments) {
      const nextPath = current.path ? `${current.path}/${segment}` : segment;
      let next = current.folders.get(segment);

      if (!next) {
        next = createFolder(nextPath, segment);
        current.folders.set(segment, next);
      }

      current = next;
    }

    current.files.push(file);
  }

  return toImmutableFolder(root);
}
