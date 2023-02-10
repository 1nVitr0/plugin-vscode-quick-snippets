import { env, QuickPickItem, QuickPickItemKind, SnippetString, SnippetTextEdit, TextEditor, window, workspace, WorkspaceEdit } from 'vscode';

export interface SnippetOptions {
  separateTemplates?: boolean;
  queryForTemplates?: boolean;
  keepPlaceholders?: boolean;
  queryTemplatesDefaultChecked?: boolean;
  templateIntegers?: boolean;
  templateFloats?: boolean;
  templateHtmlColors?: boolean;
  templateRepeatVars?: boolean | number;
  templateRepeatStrings?: boolean | number;
}

export class DynamicSnippetService {
  public async provideSelectionSnippet (editor: TextEditor, options?: SnippetOptions): Promise<SnippetString[]> {
    let templateOffset = 1;
    return await Promise.all(editor.selections.map(async (selection) => {
      const text = editor.document.getText(selection);
      const templates = await this.getTemplates(text, options);
      const snippet = new SnippetString(this.replaceTemplates(text, templates, templateOffset, options?.keepPlaceholders));

      if (options?.separateTemplates) templateOffset += templates.length;
      return snippet;
    }));
  }

  public async provideClipboardSnippet (options?: SnippetOptions): Promise<SnippetString[]> {
    const text = await env.clipboard.readText();
    const templates = await this.getTemplates(text, options);
    return [new SnippetString(this.replaceTemplates(text, templates, 0, options?.keepPlaceholders))];
  }

  public provideSnippetEdit (editor: TextEditor, snippets: SnippetString[]): WorkspaceEdit {
    const { selections } = editor;
    const edit = new WorkspaceEdit();

    if (selections.length !== snippets.length && snippets.length > 1) {
      throw new Error("Selections and snippets must be the same length");
    } else if (selections.length > 1 && snippets.length == 1) {
      // Multi cursor, single snippet
      const lines = snippets[0].value.split("\n").map((snippet) => new SnippetString(snippet));
      if (lines.length == selections.length) snippets = lines;
    } else if (snippets.length === 0) {
      return edit;
    }

    edit.set(
      editor.document.uri,
      editor.selections.map((selection, i) => {
        const snippet = snippets.length > i ? snippets[i] : snippets[0];
        return new SnippetTextEdit(selection, snippet);
      })
    );

    return edit;
  }

  private replaceTemplates (text: string, templates: string[], start?: number, keepPlaceholder?: boolean): string;
  private replaceTemplates (text: string, templates: string[], replaceWith?: string): string;
  private replaceTemplates (text: string, templates: string[], replaceWithOrStart: string | number = 0, keepPlaceholder = true): string {
    const replaceWith = typeof replaceWithOrStart === "string" ? replaceWithOrStart : null;

    let newText = text;
    let i = typeof replaceWithOrStart === "number" ? replaceWithOrStart : 1;
    for (const template of templates) {
      const regex = new RegExp(`(?<=\\W|^)${template}(?=\\W|$)`);
      const replace = replaceWith ?? (keepPlaceholder
        ? `\${${i++}:${template}}`
        : template);
      newText = newText.replace(regex, replace);
    }

    return newText;
  }

  private async getTemplates (text: string, options?: SnippetOptions): Promise<string[]> {
    const templates: string[] = [];
    if (options?.templateIntegers) {
      const matches = text.match(/(?<=\W|^)\d+(?=\W|$)/g);
      if (matches) templates.push(...matches);
    }
    if (options?.templateFloats) {
      const matches = text.match(/(?<=\W|^)\d+\.\d+(?=\W|$)/g);
      if (matches) templates.push(...matches);
    }
    if (options?.templateHtmlColors) {
      const matches = text.match(/(?<=\W|^)#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})(?=\W|$)/g);
      if (matches) templates.push(...matches);
    }
    if (options?.templateRepeatStrings) {
      const minRepeat = typeof options.templateRepeatStrings === "number" ? options.templateRepeatStrings : 2;
      const strings = text.match(/"((?<=\\)"|[^"])+"|'((?<=\\)'|[^'])+'|`((?<=\\)`|[^`])+`/g) ?? [];
      const repeatStrings = this.filterRepeats(strings, minRepeat);
      templates.push(...repeatStrings);
    }

    const cleanedText = this.replaceTemplates(text, templates, "");

    if (options?.templateRepeatVars) {
      const minRepeat = typeof options.templateRepeatVars === "number" ? options.templateRepeatVars : 2;
      const vars = cleanedText.match(/(?<=\W|^)\w+(?=\W|$)/g) ?? [];
      const reserved: string[] = workspace.getConfiguration("quick-snippets").reservedWords;
      const repeatVars = this.filterRepeats(vars, minRepeat, reserved);
      templates.push(...repeatVars);
    }

    if (options?.queryForTemplates) {
      const items: QuickPickItem[] = templates.map((template) => ({
        label: template,
        picked: options?.queryTemplatesDefaultChecked,
        kind: QuickPickItemKind.Default
      }));
      const picked = await window.showQuickPick(items, {
        title: "Select templates to use",
        canPickMany: true,

      });

      if (picked) templates.splice(0, templates.length, ...picked.map((item) => item.label));
    }

    return templates;
  }

  private filterRepeats (strings: string[], minRepeat: number, ignore?: string[]): string[] {
    const counts = strings.reduce<Record<string, number>>((counts, str) => {
      counts[str] = counts[str] ? counts[str] + 1 : 1;
      return counts;
    }, {});

    return Object.entries(counts)
      .filter(([str, count]) => count > minRepeat && !ignore?.includes(str))
      .map(([str]) => str);
  }
}
