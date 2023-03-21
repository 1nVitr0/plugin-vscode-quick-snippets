import {
  Disposable,
  SnippetString,
  TextEditor,
  TextEditorEdit,
  window,
  workspace,
  Uri,
  TabInputText,
  QuickPickItem,
  ThemeIcon,
} from "vscode";
import { ExtensionConfiguration } from "../providers/ConfigurationProvider";
import { SnippetClipboardContentProvider } from "../providers/SnippetClipboardContentProvider";

export interface SnippetTemplate {
  label: string;
  template?: string;
}

export type Counter = "n" | "-n" | `n+${number}` | `${number}-n`;

export class SnippetEditorService implements Disposable {
  public constructor(
    private config: ExtensionConfiguration,
    private contentProvider: SnippetClipboardContentProvider
  ) {}

  public dispose() {
    // Placeholder for future use
  }

  public async provideEditorEditedSnippet(text: string | SnippetString): Promise<SnippetString> {
    let currentText = typeof text === "string" ? text : text.value;
    const uri = this.contentProvider.registerSnippetDocument(currentText);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);

    const edited = await new Promise<SnippetString>((resolve, reject) => {
      const disposables = [
        this.contentProvider.onDidChange(async (uri) => {
          if (uri.toString() === document.uri.toString())
            currentText = (await this.contentProvider.provideTextDocumentContent(uri)) ?? currentText;
        }),
        window.tabGroups.onDidChangeTabs((tabs) => {
          if (
            tabs.closed.some(
              ({ input }) => input instanceof TabInputText && input.uri.toString() === document.uri.toString()
            )
          ) {
            disposables.forEach((d) => d.dispose());
            resolve(new SnippetString(currentText));
          }
        }),
      ];
    });

    this.contentProvider.disposeDocument(uri);
    return edited;
  }

  public applySelectionTemplates(editor: TextEditor, textEdit: TextEditorEdit) {
    const { keepPlaceholders, appendToExistingTemplates } = this.config;
    const { selections, document } = editor;
    const documentText = document.getText();

    const templates = this.getExistingTemplates(documentText);
    let nextIndex = templates.length;

    // Empty the templates array if we're not appending to existing templates
    if (!appendToExistingTemplates) templates.splice(0, templates.length);

    for (const selection of selections) {
      const { start, end } = selection;
      const offsetStart = document.offsetAt(start);
      const text = documentText.slice(offsetStart, document.offsetAt(end));
      const index = templates.indexOf(text);
      let template = keepPlaceholders
        ? `\$\{${index > -1 ? index + 1 : ++nextIndex}:${text}\}`
        : `\$${index > -1 ? index + 1 : ++nextIndex}`;

      if (documentText[offsetStart - 1] === "\\") template = `\\${template}`;
      if (index === -1) templates.push(text);
      textEdit.replace(selection, template);
    }
  }

  public applySelectionCounter(editor: TextEditor, textEdit: TextEditorEdit, counter: Counter = "n") {
    const { selections } = editor;

    for (const selection of selections) {
      const template = `\$\{${counter}\}`;
      textEdit.replace(selection, template);
    }
  }

  public async showTemplateSelectQuickPick(
    templates: Record<string, number>,
    queryTemplatesChecked?: boolean
  ): Promise<SnippetTemplate[] | undefined> {
    const quickPick = window.createQuickPick<QuickPickItem & { template?: string }>();
    quickPick.title = "Select templates to use";
    quickPick.canSelectMany = true;
    quickPick.items = Object.entries(templates)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([text, count]) => ({
        label: text,
        picked: queryTemplatesChecked,
        description: `Used ${count} times`,
        buttons: /^\d+$/.test(text)
          ? [
              {
                iconPath: new ThemeIcon("symbol-numeric"),
                tooltip: "Use as counter template",
              },
            ]
          : [],
      }));

    quickPick.onDidTriggerItemButton(async ({ item }) => {
      const { label } = item;
      item.template = `n+${label}`;
      item.detail = `$(symbol-numeric) Counter template: ${item.template}`;
      quickPick.items = quickPick.items.map((i) => (i.label === label ? item : i));
      quickPick.selectedItems = [...quickPick.selectedItems, item];
    });

    const picked = await new Promise<readonly (QuickPickItem & { template?: string })[] | undefined>((resolve) => {
      quickPick.onDidAccept(() => {
        resolve(quickPick.selectedItems);
        quickPick.dispose();
      });
      quickPick.onDidHide(() => resolve(undefined));
      quickPick.show();
    });

    return picked?.map((item) => item);
  }

  public async showCounterTemplateQuickPick(
    n = 100,
    includeNegative = true,
    pick?: number
  ): Promise<Counter | undefined> {
    const items: QuickPickItem[] = [
      { label: "Custom...", description: "Enter a custom counter offset" },
      { label: "n", picked: pick === 0 },
      ...(includeNegative ? [{ label: "-n", picked: pick === -1 }] : []),
    ];
    for (let i = 1; i <= n; i++) {
      items.push({ label: `n+${i}`, picked: pick === i });
      if (includeNegative) items.push({ label: `${i}-n`, picked: pick === i });
    }

    const counter = await window.showQuickPick(items, { title: "Select the counter offset", placeHolder: "n" });
    if (!counter) return undefined;

    if (counter.label === "Custom...") {
      const input = await window.showInputBox({
        title: "Enter the counter offset",
        placeHolder: "n",
        validateInput: (value) => {
          if (!value) return undefined;
          if (!/n(\+\d+)?|(\d+)?\-n/.test(value)) return "Invalid counter, must be in the form of n+1, 1-n, -n or n";
        },
      });
      if (!input) return undefined;

      return input as Counter;
    }

    return counter.label as Counter;
  }

  private getExistingTemplates(text: string): string[] {
    const regex = /\$(\d+)|\$\{(\d+):([^\}]+)\}|\$\{(\d+)\|([^\}]+)\}/g;
    const templates: string[] = [];

    let match;
    while ((match = regex.exec(text))) {
      const index = parseInt(match[1] || match[2] || match[4]);
      const value = match[3] || match[5];
      templates[index - 1] = value;
    }

    return templates;
  }
}
