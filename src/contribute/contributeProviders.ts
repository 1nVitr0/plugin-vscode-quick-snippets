import { Disposable, workspace } from "vscode";
import { SnippetClipboardFileSystemProvider } from "../providers/SnippetClipboardFileSystemProvider";

export function contributeProviders(fileSystemProvider: SnippetClipboardFileSystemProvider): Disposable[] {
  return [
    workspace.registerFileSystemProvider(fileSystemProvider.scheme, fileSystemProvider, { isCaseSensitive: true }),
  ];
}
