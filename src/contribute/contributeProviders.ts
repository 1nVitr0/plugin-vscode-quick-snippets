import { SnippetClipboardContentProvider } from '../providers/SnippetClipboardContentProvider';
import { Disposable, workspace } from 'vscode';

export function contributeProviders (contentProvider: SnippetClipboardContentProvider): Disposable[] {
  return [
    workspace.registerTextDocumentContentProvider(contentProvider.scheme, contentProvider),
  ];
}