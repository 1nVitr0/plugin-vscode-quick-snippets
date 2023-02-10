import { SnippetString, ExtensionContext } from 'vscode';

export class SnippetClipboardService {
  private useGlobalState = true;
  private keepHistory: number = 10;

  public constructor(private context: ExtensionContext) { }

  private get snippetHistory (): readonly SnippetString[][] {
    return this.useGlobalState
      ? this.context.globalState.get<SnippetString[][]>('snippetHistory', [])
      : this.context.workspaceState.get<SnippetString[][]>('snippetHistory', []);
  }

  private set snippetHistory (value: readonly SnippetString[][]) {
    if (this.useGlobalState) {
      this.context.globalState.update('snippetHistory', value);
    } else {
      this.context.workspaceState.update('snippetHistory', value);
    }
  }

  public provideSnippetHistory (): Readonly<SnippetString>[][] {
    return this.snippetHistory.map((snippets) => {
      return snippets.map((snippet) => {
        const copy = new SnippetString(snippet.value);
        return Object.freeze(copy);
      });
    });
  }

  public async copy (snippets: SnippetString[]): Promise<void> {
    const { snippetHistory, keepHistory } = this;
    this.snippetHistory = [snippets, ...snippetHistory];
    if (snippetHistory.length > keepHistory) {
      this.snippetHistory = snippetHistory.slice(0, keepHistory);
    }
  }

  public async copyIndex (snippets: SnippetString[], index = 0): Promise<void> {
    const { snippetHistory } = this;
    if (index < 0 || index >= snippetHistory.length) {
      throw new Error(`Index ${index} is out of bounds`);
    }

    this.snippetHistory = [
      ...snippetHistory.slice(0, index),
      snippets,
      ...snippetHistory.slice(index + 1),
    ];
  }

  public async paste (): Promise<SnippetString[] | undefined> {
    return this.snippetHistory[0];
  }

  public async pasteIndex (index: number): Promise<SnippetString[] | undefined> {
    const { snippetHistory } = this;
    if (index < 0 || index >= snippetHistory.length) return undefined;

    const snippet = snippetHistory[index];
    if (index > 0) {
      this.snippetHistory = [
        snippet,
        ...snippetHistory.slice(0, index),
        ...snippetHistory.slice(index + 1),
      ];
    }
    return snippet;
  }

  public async clear (): Promise<void> {
    this.snippetHistory = [];
  }
}