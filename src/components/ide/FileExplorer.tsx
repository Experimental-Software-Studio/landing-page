"use client";

import { ChevronDown, ChevronRight, PanelTopClose } from "lucide-react";
import { clsx } from "clsx";
import { SetiFileIcon } from "./SetiFileIcon";
import {
  isWorkspaceFile,
  type WorkspaceFolder,
  type WorkspaceNode,
} from "@/features/workspace/types";

interface FileExplorerProps {
  tree: WorkspaceFolder;
  activeFileId: string | null;
  expandedFolderIds: Set<string>;
  modifiedFileIds?: Set<string>;
  onSelectFile: (fileId: string) => void;
  onPinFile: (fileId: string) => void;
  onExpandedFolderIdsChange: (expandedFolderIds: Set<string>) => void;
}

export function FileExplorer({
  tree,
  activeFileId,
  expandedFolderIds,
  modifiedFileIds = new Set(),
  onSelectFile,
  onPinFile,
  onExpandedFolderIdsChange,
}: FileExplorerProps) {
  function toggleFolder(folderId: string) {
    const next = new Set(expandedFolderIds);

    if (next.has(folderId)) {
      next.delete(folderId);
    } else {
      next.add(folderId);
    }

    onExpandedFolderIdsChange(next);
  }

  function collapseAllFolders() {
    onExpandedFolderIdsChange(new Set([tree.id]));
  }

  return (
    <aside className="explorer" aria-label="Explorer">
      <div className="explorer-title">Explorer</div>
      <TreeFolder
        folder={tree}
        activeFileId={activeFileId}
        modifiedFileIds={modifiedFileIds}
        depth={0}
        expandedFolderIds={expandedFolderIds}
        onSelectFile={onSelectFile}
        onPinFile={onPinFile}
        onToggleFolder={toggleFolder}
        onCollapseAll={collapseAllFolders}
      />
    </aside>
  );
}

export function getInitiallyExpandedFolderIds(
  tree: WorkspaceFolder,
  activeFileId: string | null,
) {
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
  activeFileId: string | null;
  modifiedFileIds: Set<string>;
  depth: number;
  expandedFolderIds: Set<string>;
  onSelectFile: (fileId: string) => void;
  onPinFile: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
  onCollapseAll?: () => void;
}

function TreeFolder({
  folder,
  activeFileId,
  modifiedFileIds,
  depth,
  expandedFolderIds,
  onSelectFile,
  onPinFile,
  onToggleFolder,
  onCollapseAll,
}: TreeFolderProps) {
  const expanded = expandedFolderIds.has(folder.id);
  const folderRow = (
    <button
      type="button"
      className={clsx("tree-row folder-row", depth === 0 && "root-folder-row")}
      style={{ paddingLeft: 10 + depth * 14 }}
      onClick={() => onToggleFolder(folder.id)}
    >
      {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
      <span>{folder.name}</span>
    </button>
  );

  return (
    <div>
      {depth === 0 && onCollapseAll ? (
        <div className="root-folder-header">
          {folderRow}
          <button
            type="button"
            className="explorer-collapse-button"
            aria-label="Collapse all folders"
            title="Collapse all folders"
            onClick={onCollapseAll}
          >
            <PanelTopClose size={15} />
          </button>
        </div>
      ) : (
        folderRow
      )}
      {expanded
        ? folder.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              activeFileId={activeFileId}
              modifiedFileIds={modifiedFileIds}
              depth={depth + 1}
              expandedFolderIds={expandedFolderIds}
              onSelectFile={onSelectFile}
              onPinFile={onPinFile}
              onToggleFolder={onToggleFolder}
            />
          ))
        : null}
    </div>
  );
}

interface TreeNodeProps {
  node: WorkspaceNode;
  activeFileId: string | null;
  modifiedFileIds: Set<string>;
  depth: number;
  expandedFolderIds: Set<string>;
  onSelectFile: (fileId: string) => void;
  onPinFile: (fileId: string) => void;
  onToggleFolder: (folderId: string) => void;
}

function TreeNode({
  node,
  activeFileId,
  modifiedFileIds,
  depth,
  expandedFolderIds,
  onSelectFile,
  onPinFile,
  onToggleFolder,
}: TreeNodeProps) {
  if (!isWorkspaceFile(node)) {
    return (
      <TreeFolder
        folder={node}
        activeFileId={activeFileId}
        modifiedFileIds={modifiedFileIds}
        depth={depth}
        expandedFolderIds={expandedFolderIds}
        onSelectFile={onSelectFile}
        onPinFile={onPinFile}
        onToggleFolder={onToggleFolder}
      />
    );
  }

  const modified = modifiedFileIds.has(node.id);

  return (
    <button
      type="button"
      className={clsx("tree-row file-row", node.id === activeFileId && "active", modified && "modified")}
      style={{ paddingLeft: 10 + depth * 14 }}
      onClick={() => onSelectFile(node.id)}
      onDoubleClick={() => onPinFile(node.id)}
    >
      <SetiFileIcon fileName={node.name} />
      <span className="file-row-name">{node.name}</span>
      {modified ? <span className="file-row-status">M</span> : null}
    </button>
  );
}
