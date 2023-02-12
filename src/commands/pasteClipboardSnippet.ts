import { QuickPickItem, QuickPickItemKind, TextEditor, window, workspace } from 'vscode';
import { SnippetServiceProvider } from "../providers/SnippetServiceProvider";
import { editSnippetClipboard } from "./editSnippetClipboard";

async function pasteIndexClipboardSnippet (index: number, services: SnippetServiceProvider, editor: TextEditor) {
  const clipboardSnippet = await services.dynamicSnippet.provideSnippetClipboardSnippet(index);
  if (!clipboardSnippet) return;

  const edit = services.dynamicSnippet.provideSnippetEdit(editor, clipboardSnippet);
  if (edit) {
    await workspace.applyEdit(edit);
    services.clipboard.incrementPasteCount();
  }
}

export async function pasteSelectClipboardSnippet (services: SnippetServiceProvider, editor: TextEditor) {
  const history = services.clipboard.provideSnippetHistory();
  const items: QuickPickItem[] = history.map((snippets, index) => ({
    kind: QuickPickItemKind.Default,
    label: snippets[0]?.value.slice(0, 20) || 'Empty',
    description: `#${index} - ${snippets.length} snippets`,
    detail: snippets.map((snippet) => snippet.value).join('\n'),
    index,
  }));

  const selected = (await window.showQuickPick(items, { placeHolder: 'Select a snippet to paste' })) as QuickPickItem & { index: number } | undefined;

  if (selected) await pasteIndexClipboardSnippet(selected.index, services, editor);
}

export const pasteClipboardSnippet = pasteIndexClipboardSnippet.bind(null, 0);

export async function pasteEditedSnippet (services: SnippetServiceProvider, editor: TextEditor) {
  await editSnippetClipboard(services);
  await pasteClipboardSnippet(services, editor);
}

export async function pasteSelectEditedSnippet (services: SnippetServiceProvider, editor: TextEditor) {
  await editSnippetClipboard(services);
  await pasteSelectClipboardSnippet(services, editor);
}
