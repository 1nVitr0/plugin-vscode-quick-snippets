import escapeStringRegexp from "escape-string-regexp";
import {
  Disposable,
  env,
  QuickPickItem,
  QuickPickItemKind,
  SnippetString,
  SnippetTextEdit,
  TextEditor,
  window,
  workspace,
  WorkspaceEdit,
} from "vscode";
import { ExtensionConfiguration } from "../providers/ConfigurationProvider";
import { SnippetServiceProvider } from "../providers/SnippetServiceProvider";

export class DynamicSnippetService implements Disposable {
  public constructor(private services: SnippetServiceProvider, private config: ExtensionConfiguration) {}

  public dispose() {
    // Placeholder for future use
  }

  public async provideSelectionSnippet(editor: TextEditor): Promise<SnippetString[]> {
    const snippets = [];

    let templateOffset = 1;
    for (const selection of editor.selections) {
      const initialIndent = selection.start.character;
      const text = this.removeIndent(editor.document.getText(selection), initialIndent);
      const templates = await this.getTemplates(text);
      let snippet = new SnippetString(this.replaceTemplates(text, templates, templateOffset));
      if (this.config.alwaysEditTemplates) snippet = await this.services.editor.provideEditorEditedSnippet(snippet);

      templateOffset += templates.length;
      snippets.push(snippet);
    }

    return snippets;
  }

  public async provideClipboardSnippet(): Promise<SnippetString[]> {
    const text = this.removeIndent(await env.clipboard.readText());
    const templates = await this.getTemplates(text);
    let snippet = new SnippetString(this.replaceTemplates(text, templates, 0));
    if (this.config.alwaysEditTemplates) snippet = await this.services.editor.provideEditorEditedSnippet(snippet);

    return [snippet];
  }

  public async provideSnippetClipboardSnippet(index = 0): Promise<SnippetString[] | undefined> {
    const snippets = await this.services.clipboard.pasteIndex(index);
    return snippets && this.replaceIndex(snippets, this.services.clipboard.pasteCount);
  }

  public provideSnippetEdit(editor: TextEditor, snippets: SnippetString[]): WorkspaceEdit {
    const { selections } = editor;
    const edit = new WorkspaceEdit();

    if (selections.length !== snippets.length && snippets.length > 1) {
      throw new Error("Selections and snippets must be the same length");
    } else if (selections.length > 1 && snippets.length === 1) {
      // Multi cursor, single snippet
      const lines = snippets[0].value.split("\n").map((snippet) => new SnippetString(snippet));
      if (lines.length === selections.length) snippets = lines;
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

  private removeIndent(text: string, initialIndent: number = Infinity): string {
    const lineEnding = text.includes("\r\n") ? "\r\n" : "\n";
    const lines = text.split(lineEnding);
    if (initialIndent !== Infinity) lines.shift(); // Ignore first line
    const indent = lines.reduce((indent, line) => {
      const match: RegExpMatchArray | null = line.match(/^\s*/);
      return match && match[0].length < indent ? match[0].length : indent;
    }, initialIndent);

    return lines.map((line) => line.slice(indent)).join("\n");
  }

  private replaceIndex(snippets: SnippetString[], index: number = 0) {
    const regex = /\$\{(n\s*([+\-]\s*\d+)?|(\s*\d+)?\s*-n)\}/;
    function replace(j: number, _: string, n?: string, offset?: string, negativeOffset?: string) {
      if (n === "-n") return `${-(index + j)}`;
      else if (negativeOffset) return `${parseInt(negativeOffset) - (index + j)}`;
      else return `${index + j + parseInt(offset ?? "0")}`;
    }

    return snippets.map(({ value }, j) => {
      const text = value.replace(regex, replace.bind(null, j));
      return new SnippetString(text);
    });
  }

  private replaceTemplates(text: string, templates: string[], startIndex?: number, keepPlaceholder?: boolean): string;
  private replaceTemplates(text: string, templates: string[], replaceWith?: string): string;
  private replaceTemplates(text: string, templates: string[], replaceWithOrStart: string | number = 0): string {
    const { keepPlaceholders } = this.config;
    const replaceWith = typeof replaceWithOrStart === "string" ? replaceWithOrStart : null;

    let newText = text;
    let i = typeof replaceWithOrStart === "number" ? replaceWithOrStart : 1;
    for (const template of templates) {
      const escaped = escapeStringRegexp(template);
      const regex = new RegExp(`(?:\\b|\\\\)${escaped}\\b`, "g");
      const replace = replaceWith ?? (keepPlaceholders ? `\${${i++}:${template}}` : template);
      newText = newText.replace(regex, (match) => (match.startsWith("\\") ? `\\${replace}` : replace));
    }

    return newText;
  }

  private async getTemplates(text: string): Promise<string[]> {
    const { autoTemplate, queryForTemplates, queryTemplatesChecked, reservedWords } = this.config;

    const templates: string[] = [];
    if (autoTemplate.integers) {
      const matches = text.match(/\b\d+\b/g);
      if (matches) templates.push(...matches);
    }
    if (autoTemplate.floats) {
      const matches = text.match(/\b\d+\.\d+\b/g);
      if (matches) templates.push(...matches);
    }
    if (autoTemplate.htmlColors) {
      const matches = text.match(/\b#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})\b/g);
      if (matches) templates.push(...matches);
    }
    if (autoTemplate.repeatStrings) {
      const minRepeat = typeof autoTemplate.repeatStrings === "number" ? autoTemplate.repeatStrings : 2;
      const strings = text.match(/"((?<=\\)"|[^"])+"|'((?<=\\)'|[^'])+'|`((?<=\\)`|[^`])+`/g) ?? [];
      const repeatStrings = this.filterRepeats(strings, minRepeat);
      templates.push(...repeatStrings);
    }

    const cleanedText = this.replaceTemplates(text, templates, "");

    if (autoTemplate.repeatVars) {
      const minRepeat = typeof autoTemplate.repeatVars === "number" ? autoTemplate.repeatVars : 2;
      const vars = cleanedText.match(/(?<=\W|^)\w+(?=\W|$)/g) ?? [];
      const reserved: string[] = reservedWords;
      const repeatVars = this.filterRepeats(vars, minRepeat, reserved);
      templates.push(...repeatVars);
    }

    if (queryForTemplates) {
      const items: QuickPickItem[] = templates.map((template) => ({
        label: template,
        picked: queryTemplatesChecked,
        kind: QuickPickItemKind.Default,
      }));
      const picked = await window.showQuickPick(items, {
        title: "Select templates to use",
        canPickMany: true,
      });

      if (picked) templates.splice(0, templates.length, ...picked.map((item) => item.label));
    }

    return templates;
  }

  private filterRepeats(strings: string[], minRepeat: number, ignore?: string[]): string[] {
    const counts = strings.reduce<Record<string, number>>((counts, str) => {
      counts[str] = counts[str] ? counts[str] + 1 : 1;
      return counts;
    }, {});

    return Object.entries(counts)
      .filter(([str, count]) => count >= minRepeat && !ignore?.includes(str))
      .map(([str]) => str);
  }
}
