import { SnippetServiceProvider } from "../providers/SnippetServiceProvider";
import { TextEditor, TextEditorEdit, QuickPickItem, window, QuickPickItemKind } from "vscode";
import { Counter } from "../services/SnippetEditorService";

export function applySelectionTemplates(services: SnippetServiceProvider, editor: TextEditor, edit: TextEditorEdit) {
  services.editor.applySelectionTemplates(editor, edit);
}

export async function applySelectionCounter(services: SnippetServiceProvider, editor: TextEditor) {
  const items: QuickPickItem[] = [
    { label: "Custom...", description: "Enter a custom counter offset" },
    { label: "n" },
    { label: "-n" },
  ];
  for (let i = 1; i <= 100; i++) items.push({ label: `n+${i}` }, { label: `${i}-n` });

  let counter = await window.showQuickPick(items, { title: "Select the counter offset", placeHolder: "n" });
  if (!counter) return;

  if (counter.label === "Custom...") {
    const input = await window.showInputBox({
      title: "Enter the counter offset",
      placeHolder: "n",
      validateInput: (value) => {
        if (!value) return;
        if (!/n(\+\d+)?|(\d+)?\-n/.test(value)) return "Invalid counter, must be in the form of n+1, 1-n, -n or n";
      },
    });
    if (!input) return;

    counter = { label: input };
  }

  editor.edit((edit) => services.editor.applySelectionCounter(editor, edit, counter?.label as Counter));
}
