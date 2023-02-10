import { TextEditor } from 'vscode';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { editClipboardAsSnippet } from './editSnippetClipboard';
import { pasteClipboardSnippet } from './pasteClipboardSnippet';

export async function pasteAsSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  const clipboardSnippet = await serviceProvider.dynamicSnippet.provideClipboardSnippet();
  serviceProvider.clipboard.copy(clipboardSnippet);

  await pasteClipboardSnippet(serviceProvider, editor);
}

export async function pasteEditAsSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  await editClipboardAsSnippet(serviceProvider);
  await pasteClipboardSnippet(serviceProvider, editor);
}