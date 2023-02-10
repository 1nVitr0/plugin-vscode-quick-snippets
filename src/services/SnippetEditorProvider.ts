import { SnippetString, TextEditor, TextEditorEdit, workspace, window } from 'vscode';

export interface SnippetEditOptions {
  appendToExistingTemplates?: boolean; // Default: true
  keepPlaceholders?: boolean; // Default: true
}

export class SnippetEditorService {
  public async provideEditorEditedSnippet (text: string | SnippetString, language?: string): Promise<SnippetString> {
    let currentText = typeof text === 'string' ? text : text.value;
    const document = await workspace.openTextDocument({ content: currentText, language });
    window.showTextDocument(document);

    return new Promise((resolve, reject) => {
      const disposables = [
        workspace.onDidChangeTextDocument((e) => {
          if (e.document.uri.toString() === document.uri.toString()) {
            currentText = e.document.getText();
          }
        }),
        workspace.onDidCloseTextDocument((e) => {
          if (e.uri.toString() === document.uri.toString()) {
            resolve(new SnippetString(currentText));
            disposables.forEach((d) => d.dispose());
          }
        }),
      ];
    })
  }

  public applySelectionTemplates (editor: TextEditor, textEdit: TextEditorEdit, options?: SnippetEditOptions) {
    const { selections, document } = editor;
    const documentText = document.getText();

    const templates = this.getExistingTemplates(documentText);
    let nextIndex = templates.length;

    // Empty the templates array if we're not appending to existing templates
    if (options?.appendToExistingTemplates !== false) templates.splice(0, templates.length);

    for (const selection of selections) {
      const { start, end } = selection;
      const text = documentText.slice(document.offsetAt(start), document.offsetAt(end));
      const index = templates.indexOf(text);
      const template = (options?.keepPlaceholders === false)
        ? `$${index > -1 ? index + 1 : ++nextIndex}:${text}`
        : `$${index > -1 ? index + 1 : ++nextIndex}`;

      if (index === -1) templates.push(text);
      textEdit.replace(selection, template);
    };
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