"use client";

import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import { SetiFileIcon } from "./SetiFileIcon";
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
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () => getInitiallyExpandedFolderIds(tree, activeFileId),
  );

  function toggleFolder(folderId: string) {
    setExpandedFolderIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  }

  return (
    <aside className="explorer" aria-label="Explorer">
      <div className="explorer-title">Explorer</div>
      <TreeFolder
        folder={tree}
        activeFileId={activeFileId}
        depth={0}
        expandedFolderIds={expandedFolderIds}
        onSelectFile={onSelectFile}
        onToggleFolder={toggleFolder}
      />
    </aside>
  );
}

function getInitiallyExpandedFolderIds(tree: WorkspaceFolder, activeFileId: string) {
  const expandedFolderIds = new Set<string>([tree.id]);

  function visit(folder: WorkspaceFolder): boolean {
    for (const child of folder.children) {
      if (isWorkspaceFile(child)) {
        if (child.id === activeFileId) {
          expandedFolderIds.add(folder.id);
          return true;
        }

        continue;
      }

      if (visit(child)) {
        expandedFolderIds.add(folder.id);
        return true;
      }
    }

    return false;
  }

  visit(tree);

  return expandedFolderIds;
}

interface TreeFolderProps {
  folder: WorkspaceFolder;
  activeFileId: string;
  depth: number;
  expandedFolderIds: Set<string>;
  onSelectFile: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
}

function TreeFolder({
  folder,
  activeFileId,
  depth,
  expandedFolderIds,
  onSelectFile,
  onToggleFolder,
}: TreeFolderProps) {
  const expanded = expandedFolderIds.has(folder.id);

  return (
    <div>
      <button
        type="button"
        className={clsx("tree-row folder-row", depth === 0 && "root-folder-row")}
        style={{ paddingLeft: 10 + depth * 14 }}
        onClick={() => onToggleFolder(folder.id)}
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
              expandedFolderIds={expandedFolderIds}
              onSelectFile={onSelectFile}
              onToggleFolder={onToggleFolder}
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
  expandedFolderIds: Set<string>;
  onSelectFile: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
}

function TreeNode({
  node,
  activeFileId,
  depth,
  expandedFolderIds,
  onSelectFile,
  onToggleFolder,
}: TreeNodeProps) {
  if (!isWorkspaceFile(node)) {
    return (
      <TreeFolder
        folder={node}
        activeFileId={activeFileId}
        depth={depth}
        expandedFolderIds={expandedFolderIds}
        onSelectFile={onSelectFile}
        onToggleFolder={onToggleFolder}
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
      <SetiFileIcon fileName={node.name} />
      <span>{node.name}</span>
    </button>
  );
}
