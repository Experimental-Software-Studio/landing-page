"use client";

import { ChevronDown, ChevronRight, FileCode2, FileLock2, Folder } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import {
  isWorkspaceFile,
  type WorkspaceFolder,
  type WorkspaceNode,
} from "@/features/workspace/types";

interface FileExplorerProps {
  tree: WorkspaceFolder;
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
}

export function FileExplorer({ tree, activeFileId, onSelectFile }: FileExplorerProps) {
  return (
    <aside className="explorer" aria-label="Explorer">
      <div className="explorer-title">Explorer</div>
      <TreeFolder
        folder={tree}
        activeFileId={activeFileId}
        depth={0}
        onSelectFile={onSelectFile}
      />
    </aside>
  );
}

interface TreeFolderProps {
  folder: WorkspaceFolder;
  activeFileId: string;
  depth: number;
  onSelectFile: (fileId: string) => void;
}

function TreeFolder({ folder, activeFileId, onSelectFile, depth }: TreeFolderProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <button
        type="button"
        className="tree-row folder-row"
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <Folder size={15} />
        <span>{folder.name}</span>
      </button>
      {expanded
        ? folder.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeFileId={activeFileId}
              depth={depth + 1}
              onSelectFile={onSelectFile}
            />
          ))
        : null}
    </div>
  );
}

interface TreeNodeProps {
  node: WorkspaceNode;
  activeFileId: string;
  depth: number;
  onSelectFile: (fileId: string) => void;
}

function TreeNode({ node, activeFileId, depth, onSelectFile }: TreeNodeProps) {
  if (!isWorkspaceFile(node)) {
    return (
      <TreeFolder
        folder={node}
        activeFileId={activeFileId}
        depth={depth}
        onSelectFile={onSelectFile}
      />
    );
  }

  return (
    <button
      type="button"
      className={clsx("tree-row file-row", node.id === activeFileId && "active")}
      style={{ paddingLeft: 10 + depth * 14 }}
      onClick={() => onSelectFile(node.id)}
    >
      {node.editable ? <FileCode2 size={15} /> : <FileLock2 size={15} />}
      <span>{node.name}</span>
    </button>
  );
}
