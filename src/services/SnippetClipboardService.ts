import { SnippetString, ExtensionContext, Disposable } from 'vscode';
import { ExtensionConfiguration } from '../providers/ConfigurationProvider';

export class SnippetClipboardService implements Disposable {
  private useGlobalState = true;
  private _pasteCount: number = 0;

  public constructor(private context: ExtensionContext, private config: ExtensionConfiguration) { }

  public get pasteCount (): number {
    return this._pasteCount;
  }

  private get snippetHistory (): readonly SnippetString[][] {
    return this.useGlobalState
      ? this.context.globalState.get<SnippetString[][]>('snippetHistory', [])
      : this.context.workspaceState.get<SnippetString[][]>('snippetHistory', []);
  }

  private set snippetHistory (value: readonly SnippetString[][]) {
    if (this.useGlobalState)
      this.context.globalState.update('snippetHistory', value);
    else
      this.context.workspaceState.update('snippetHistory', value);

  }

  public dispose () {
    // Placeholder for future use
  }

  public async clear (): Promise<void> {
    this.snippetHistory = [];
  }

  public resetPasteCount () {
    this._pasteCount = 0;
  }

  public incrementPasteCount (n = 1) {
    this._pasteCount += n;
  }

  public getIndex (snippets: SnippetString[]): number {
    const { snippetHistory } = this;
    return snippetHistory.indexOf(snippets);
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
    const { keepHistory } = this.config;
    this.snippetHistory = [
      snippets,
      ...this.snippetHistory.slice(0, keepHistory - 1),
    ];
    this.resetPasteCount();
  }

  public async copyIndex (snippets: SnippetString[], index = 0): Promise<void> {
    const { snippetHistory } = this;
    if (index < 0 || index >= snippetHistory.length)
      throw new Error(`Index ${index} is out of bounds`);


    this.snippetHistory = [
      ...snippetHistory.slice(0, index),
      snippets,
      ...snippetHistory.slice(index + 1),
    ];

    if (index !== 0) this.resetPasteCount();
  }

  public async paste (): Promise<SnippetString[] | undefined> {
    return await this.pasteIndex(0);
  }

  public async pasteIndex (index: number): Promise<SnippetString[] | undefined> {
    const { snippetHistory } = this;
    if (index < 0 || index >= snippetHistory.length) return undefined;

    const snippets = snippetHistory[index];
    if (index > 0) {
      this.snippetHistory = [
        snippets,
        ...snippetHistory.slice(0, index),
        ...snippetHistory.slice(index + 1),
      ];
      this.resetPasteCount();
    }
    return snippets;
  }
}