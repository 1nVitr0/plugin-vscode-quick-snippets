import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';

async function editSnippetClipboardAtIndex (index: number, services: SnippetServiceProvider) {
  const activeClipboard = await services.clipboard.pasteIndex(index);
  if (!activeClipboard) return;

  const edits = await Promise.all(activeClipboard.map(async (snippet) => {
    return await services.editor.provideEditorEditedSnippet(snippet);
  }));

  services.clipboard.copyIndex(edits, index);
}

export const editSnippetClipboard = editSnippetClipboardAtIndex.bind(null, 0);

export async function editClipboardAsSnippet (services: SnippetServiceProvider) {
  const clipboardSnippet = await services.dynamicSnippet.provideClipboardSnippet();
  await services.clipboard.copy(clipboardSnippet);

  await editSnippetClipboard(services);
}

export function clearSnippetClipboard (services: SnippetServiceProvider) {
  services.clipboard.clear();
}