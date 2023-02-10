import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';

async function editSnippetClipboardAtIndex (index: number, serviceProvider: SnippetServiceProvider) {
  const activeClipboard = await serviceProvider.clipboard.pasteIndex(index);
  if (!activeClipboard) return;

  const edits = await Promise.all(activeClipboard.map(async (snippet) => {
    return await serviceProvider.editor.provideEditorEditedSnippet(snippet);
  }));

  serviceProvider.clipboard.copyIndex(edits, index);
}

export const editSnippetClipboard = editSnippetClipboardAtIndex.bind(null, 0);

export async function editClipboardAsSnippet (serviceProvider: SnippetServiceProvider) {
  const clipboardSnippet = await serviceProvider.dynamicSnippet.provideClipboardSnippet();
  await serviceProvider.clipboard.copy(clipboardSnippet);

  await editSnippetClipboard(serviceProvider);
}

export function clearSnippetClipboard (serviceProvider: SnippetServiceProvider) {
  serviceProvider.clipboard.clear();
}