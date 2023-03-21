import { TextEditor } from 'vscode';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { editClipboardAsSnippet } from './editSnippetClipboard';
import { pasteClipboardSnippet } from './pasteClipboardSnippet';

export async function pasteAsSnippet (services: SnippetServiceProvider, editor: TextEditor) {
  const clipboardSnippet = await services.dynamicSnippet.provideClipboardSnippet();

  if (clipboardSnippet.length) {
    services.clipboard.copy(clipboardSnippet);
    await pasteClipboardSnippet(services, editor);
  }
}

export async function pasteEditAsSnippet (services: SnippetServiceProvider, editor: TextEditor) {
  await editClipboardAsSnippet(services);
  await pasteClipboardSnippet(services, editor);
}