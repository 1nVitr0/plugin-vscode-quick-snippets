import { TextEditor } from 'vscode';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { editSnippetClipboard } from './editSnippetClipboard';

export async function copyToSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  const snippets = await serviceProvider.dynamicSnippet.provideSelectionSnippet(editor);
  await serviceProvider.clipboard.copy(snippets);
}

export async function copyEditToSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  const snippets = await serviceProvider.dynamicSnippet.provideSelectionSnippet(editor);
  await serviceProvider.clipboard.copy(snippets);
  await editSnippetClipboard(serviceProvider);
}