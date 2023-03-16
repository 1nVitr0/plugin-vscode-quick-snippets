import { randomUUID } from 'crypto';
import {
  CancellationToken,
  EventEmitter,
  ProviderResult,
  TextDocumentContentProvider,
  Uri,
  TextEditorEdit,
} from "vscode";
import { StringTextEditProvider } from './StringTextEditProvider';

export class SnippetClipboardContentProvider implements TextDocumentContentProvider {
  public readonly scheme = 'snippet-clipboard';
  private _onDidChange = new EventEmitter<Uri>();
  private documents = new Map<string, string>();

  public onDidChange = this._onDidChange.event;

  public provideTextDocumentContent (uri: Uri, token?: CancellationToken): ProviderResult<string> {
    return this.documents.get(uri.path) ?? '';
  }

  public registerSnippetDocument (text: string): Uri {
    const documentId = randomUUID();
    const uri = Uri.parse(`snippet-clipboard:${documentId}`);
    this.documents.set(uri.path, text);
    this._onDidChange.fire(uri);

    return uri;
  }

  public replaceSnippetDocument (uri: Uri, text: string): void {
    this.documents.set(uri.path, text);
    this._onDidChange.fire(uri);
  }

  public edit (uri: Uri, callback: (editor: TextEditorEdit) => void): boolean {
    const edit = new StringTextEditProvider(this.documents.get(uri.path) ?? '');
    callback(edit);
    const editedText = edit.apply();

    if (editedText === false) return false;

    this.replaceSnippetDocument(uri, editedText);
    return true;
  }

  public disposeDocument (uri: Uri): void {
    this.documents.delete(uri.path);
    this._onDidChange.fire(uri);
  }
}