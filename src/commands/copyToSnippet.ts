import { TextEditor } from 'vscode';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { editSnippetClipboard } from './editSnippetClipboard';

export async function copyToSnippet(services: SnippetServiceProvider, editor: TextEditor) {
  const snippets = await services.dynamicSnippet.provideSelectionSnippet(editor);
  if (snippets.length) await services.clipboard.copy(snippets);
}

export async function copyEditToSnippet(services: SnippetServiceProvider, editor: TextEditor) {
  const snippets = await services.dynamicSnippet.provideSelectionSnippet(editor);

  if (snippets.length) {
    await services.clipboard.copy(snippets);
    await editSnippetClipboard(services);
  }
}