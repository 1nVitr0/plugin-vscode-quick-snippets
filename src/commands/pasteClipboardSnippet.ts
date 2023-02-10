import { QuickPickItem, QuickPickItemKind, TextEditor, window, workspace } from 'vscode';
import { SnippetServiceProvider } from "../providers/SnippetServiceProvider";
import { editSnippetClipboard } from "./editSnippetClipboard";

async function pasteIndexClipboardSnippet (index: number, serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  const clipboardSnippet = await serviceProvider.clipboard.pasteIndex(index)
  if (!clipboardSnippet) return;

  const edit = serviceProvider.dynamicSnippet.provideSnippetEdit(editor, clipboardSnippet);
  if (edit) await workspace.applyEdit(edit);
}

export async function pasteSelectClipboardSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  const history = serviceProvider.clipboard.provideSnippetHistory();
  const items: QuickPickItem[] = history.map((snippets, index) => ({
    kind: QuickPickItemKind.Default,
    label: snippets[0]?.value.slice(0, 20) || 'Empty',
    description: `#${index} - ${snippets.length} snippets`,
    detail: snippets.map((snippet) => snippet.value).join('\n'),
    index,
  }));

  const selected = (await window.showQuickPick(items, { placeHolder: 'Select a snippet to paste' })) as QuickPickItem & { index: number } | undefined;

  if (selected) await pasteIndexClipboardSnippet(selected.index, serviceProvider, editor);
}

export const pasteClipboardSnippet = pasteIndexClipboardSnippet.bind(null, 0);

export async function pasteEditedSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  await editSnippetClipboard(serviceProvider);
  await pasteClipboardSnippet(serviceProvider, editor);
}

export async function pasteSelectEditedSnippet (serviceProvider: SnippetServiceProvider, editor: TextEditor) {
  await editSnippetClipboard(serviceProvider);
  await pasteSelectClipboardSnippet(serviceProvider, editor);
}
