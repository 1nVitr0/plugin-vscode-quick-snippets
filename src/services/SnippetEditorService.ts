import { Disposable, SnippetString, TextEditor, TextEditorEdit, window, workspace, Uri, TabInputText } from 'vscode';
import { ExtensionConfiguration } from '../providers/ConfigurationProvider';
import { SnippetClipboardContentProvider } from '../providers/SnippetClipboardContentProvider';

export type Counter = "n" | "-n" | `n+${number}` | `${number}-n`;

export class SnippetEditorService implements Disposable {
  public constructor(private config: ExtensionConfiguration, private contentProvider: SnippetClipboardContentProvider) { }

  public dispose () {
    // Placeholder for future use
  }

  public async provideEditorEditedSnippet (text: string | SnippetString): Promise<SnippetString> {
    let currentText = typeof text === 'string' ? text : text.value;
    const uri = this.contentProvider.registerSnippetDocument(currentText);
    const document = await workspace.openTextDocument(uri);
    await window.showTextDocument(document);

    const edited = await new Promise<SnippetString>((resolve, reject) => {
      const disposables = [
        this.contentProvider.onDidChange(async (uri) => {
          if (uri.toString() === document.uri.toString())
            currentText = await this.contentProvider.provideTextDocumentContent(uri) ?? currentText;
        }),
        window.tabGroups.onDidChangeTabs(tabs => {
          if (tabs.closed.some(({ input }) => input instanceof TabInputText && input.uri.toString() === document.uri.toString())) {
            disposables.forEach((d) => d.dispose());
            resolve(new SnippetString(currentText));
          }
        }),
      ];
    });

    this.contentProvider.disposeDocument(uri);
    return edited;
  }

  public applySelectionTemplates (editor: TextEditor, textEdit: TextEditorEdit) {
    const { keepPlaceholders, appendToExistingTemplates } = this.config;
    const { selections, document } = editor;
    const documentText = document.getText();

    const templates = this.getExistingTemplates(documentText);
    let nextIndex = templates.length;

    // Empty the templates array if we're not appending to existing templates
    if (!appendToExistingTemplates) templates.splice(0, templates.length);

    for (const selection of selections) {
      const { start, end } = selection;
      const text = documentText.slice(document.offsetAt(start), document.offsetAt(end));
      const index = templates.indexOf(text);
      const template = keepPlaceholders
        ? `\$\{${index > -1 ? index + 1 : ++nextIndex}:${text}\}`
        : `\$${index > -1 ? index + 1 : ++nextIndex}`;

      if (index === -1) templates.push(text);
      textEdit.replace(selection, template);
    }
  }

  public applySelectionCounter (editor: TextEditor, textEdit: TextEditorEdit, counter: Counter = 'n') {
    const { selections } = editor;

    for (const selection of selections) {
      const template = `\$\{${counter}\}`;
      textEdit.replace(selection, template);
    }
  }

  private getExistingTemplates (text: string): string[] {
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