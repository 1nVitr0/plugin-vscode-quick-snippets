import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { QuickPickItem, QuickPickItemKind, window } from 'vscode';

async function editSnippetClipboardAtIndex (index: number, services: SnippetServiceProvider) {
  const activeClipboard = await services.clipboard.pasteIndex(index);
  if (!activeClipboard) return;

  const edits = await Promise.all(activeClipboard.map(async (snippet) => {
    return await services.editor.provideEditorEditedSnippet(snippet);
  }));

  services.clipboard.copyIndex(edits, index);
}

export const editSnippetClipboard = editSnippetClipboardAtIndex.bind(null, 0);

export async function editSelectSnippetClipboard (services: SnippetServiceProvider) {
  const history = services.clipboard.provideSnippetHistory();
  const items: QuickPickItem[] = history.map((snippets, index) => ({
    kind: QuickPickItemKind.Default,
    label: snippets[0]?.value.slice(0, 20) || 'Empty',
    description: `#${index} - ${snippets.length} snippets`,
    detail: snippets.map((snippet) => snippet.value).join('\n'),
    index,
  }));

  const selected = (await window.showQuickPick(items, { placeHolder: 'Select a snippet to paste' })) as QuickPickItem & { index: number } | undefined;

  if (selected) await editSnippetClipboardAtIndex(selected.index, services);
}

export async function editClipboardAsSnippet (services: SnippetServiceProvider) {
  const clipboardSnippet = await services.dynamicSnippet.provideClipboardSnippet();

  if (clipboardSnippet.length) {
    await services.clipboard.copy(clipboardSnippet);
    await editSnippetClipboard(services);
  }
}

export function clearSnippetClipboard (services: SnippetServiceProvider) {
  services.clipboard.clear();
}