import escapeStringRegexp from "escape-string-regexp";
import { Disposable, env, SnippetString, SnippetTextEdit, TextEditor, WorkspaceEdit } from "vscode";
import { ExtensionConfiguration } from "../providers/ConfigurationProvider";
import { SnippetServiceProvider } from "../providers/SnippetServiceProvider";
import { SnippetTemplate } from "./SnippetEditorService";

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
    const regex = /\$\{(?:\d+:)?(n\s*([+\-]\s*\d+)?|(\s*\d+)?\s*-n)\}/;
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

  private replaceTemplates(
    text: string,
    templates: (string | SnippetTemplate)[],
    startIndex?: number,
    keepPlaceholder?: boolean
  ): string;
  private replaceTemplates(text: string, templates: (string | SnippetTemplate)[], replaceWith?: string): string;
  private replaceTemplates(
    text: string,
    templates: (string | SnippetTemplate)[],
    replaceWithOrStart: string | number = 0
  ): string {
    const { keepPlaceholders } = this.config;
    const replaceWith = typeof replaceWithOrStart === "string" ? replaceWithOrStart : null;

    let newText = text;
    let i = typeof replaceWithOrStart === "number" ? replaceWithOrStart : 1;
    for (const entry of templates) {
      const { label, template = undefined } = typeof entry === "object" && "label" in entry ? entry : { label: entry };
      const escaped = escapeStringRegexp(label);
      const regex = new RegExp(`(?:\\b|\\\\)${escaped}\\b`, "g");
      const replace = replaceWith ?? (keepPlaceholders ? `\${${i++}:${template ?? label}}` : template ?? label);
      newText = newText.replace(regex, (match) => (match.startsWith("\\") ? `\\${replace}` : replace));
    }

    return newText;
  }

  private async getTemplates(text: string): Promise<SnippetTemplate[]> {
    const { autoTemplate, queryForTemplates, queryTemplatesChecked, reservedWords } = this.config;
    const { editor } = this.services;
    let templates: Record<string, number> = {};

    if (autoTemplate.integers) {
      const matches = text.match(/\b\d+\b/g);
      if (matches) templates = { ...templates, ...this.filterRepeats(matches, 1) };
    }

    if (autoTemplate.floats) {
      const matches = text.match(/\b\d+\.\d+\b/g);
      if (matches) templates = { ...templates, ...this.filterRepeats(matches, 1) };
    }

    if (autoTemplate.htmlColors) {
      const matches = text.match(/\b#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})\b/g);
      if (matches) templates = { ...templates, ...this.filterRepeats(matches, 1) };
    }

    if (autoTemplate.repeatStrings) {
      const minRepeat = typeof autoTemplate.repeatStrings === "number" ? autoTemplate.repeatStrings : 2;
      const strings = text.match(/"((?<=\\)"|[^"])+"|'((?<=\\)'|[^'])+'|`((?<=\\)`|[^`])+`/g) ?? [];
      templates = { ...templates, ...this.filterRepeats(strings, minRepeat) };
    }

    if (autoTemplate.repeatVars) {
      const cleanedText = this.replaceTemplates(text, Object.keys(templates), "");
      const minRepeat = typeof autoTemplate.repeatVars === "number" ? autoTemplate.repeatVars : 2;
      const vars = cleanedText.match(/(?<=\W|^)\w+(?=\W|$)/g) ?? [];
      const reserved: string[] = reservedWords;
      templates = { ...templates, ...this.filterRepeats(vars, minRepeat, reserved) };
    }

    if (autoTemplate.repeatSpacedTerms) {
      const minRepeat = typeof autoTemplate.repeatStrings === "number" ? autoTemplate.repeatStrings : 2;
      const terms = this.getRepeatSpacedTerms(text, minRepeat, templates);
      templates = { ...templates, ...terms };
    }

    if (queryForTemplates) return editor.showTemplateSelectQuickPick(templates, queryTemplatesChecked);
    else return Object.keys(templates).map((label) => ({ label }));
  }

  private filterRepeats(strings: string[], minRepeat: number, ignore?: string[]): Record<string, number> {
    const counts = strings.reduce<Record<string, number>>((counts, str) => {
      counts[str] = counts[str] ? counts[str] + 1 : 1;
      return counts;
    }, {});

    return Object.entries(counts).reduce<Record<string, number>>((repeats, [str, count]) => {
      if (count >= minRepeat && !ignore?.includes(str)) repeats[str] = count;
      return repeats;
    }, {});
  }

  private getRepeatSpacedTerms(
    text: string,
    minRepeat: number,
    ignore?: Record<string, number>
  ): Record<string, number> {
    const wordRegex = /\b\w+\b/g;

    let templates: Record<string, number> = {};
    let words: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    let skipTemplates = true;
    while ((match = wordRegex.exec(text))) words.push(match);

    while (words.length) {
      const strings = words.map((word) => word[0]);
      const repeatStrings = this.filterRepeats(strings, minRepeat);
      const repeatStringTexts = Object.keys(repeatStrings);
      words = words.filter((word) => repeatStringTexts.includes(word[0]));

      if (!skipTemplates || (skipTemplates = false)) templates = { ...templates, ...repeatStrings };

      words = words
        .map((word) => {
          const { index, [0]: original } = word;
          let result = original;
          let stopAtWordBreak = false;
          for (let i = index + original.length; true; i++) {
            const nextChar = text[i];
            if (nextChar === " " || nextChar === "\t" || nextChar === "-") {
              if (stopAtWordBreak) break;
              else result += nextChar;
              stopAtWordBreak = true;
            } else if (/\w/.test(nextChar)) {
              result += nextChar;
            } else {
              break;
            }
          }

          return result.trim() !== original ? { ...word, [0]: result } : null;
        })
        .filter((word) => !!word) as RegExpExecArray[];
    }

    if (ignore) {
      // Remove any templates that were already found
      for (const template of Object.keys(ignore)) delete templates[template];
    }

    return templates;
  }
}
