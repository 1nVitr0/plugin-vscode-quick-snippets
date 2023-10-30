import { randomUUID } from "crypto";
import {
  Disposable,
  EventEmitter,
  FileChangeEvent,
  FileChangeType,
  FileStat,
  FileSystemError,
  FileSystemProvider,
  FileType,
  Uri,
} from "vscode";

const NOT_SUPPORTED =
  <R>(method: string) =>
  (): R => {
    throw new Error(`Method ${method} is not supported`);
  };

export class SnippetClipboardFileSystemProvider implements FileSystemProvider, Disposable {
  public readonly scheme = "snippet-clipboard";
  private _onDidChangeFile = new EventEmitter<FileChangeEvent[]>();
  private documents = new Map<string, FileStat & { content: Uint8Array }>();
  private watchedFiles = new Map<string, string[]>();
  private watchAll: string[] = [];

  public onDidChangeFile = this._onDidChangeFile.event;

  public readDirectory = NOT_SUPPORTED<[string, FileType][]>("readDirectory");
  public createDirectory = NOT_SUPPORTED<void>("createDirectory");

  public watch(uri: Uri, { recursive }: { readonly recursive: boolean }): Disposable {
    const id = randomUUID();
    const watchers = this.watchedFiles.get(uri.path) ?? [];
    const path = uri.path;

    if (recursive) {
      this.watchAll.push(id);
      const disposable = new Disposable(() => {
        const index = this.watchAll.indexOf(id);
        if (index !== -1) this.watchAll.splice(index, 1);
      });

      return disposable;
    }

    this.watchedFiles.set(path, [...watchers, id]);
    const disposable = new Disposable(() => {
      const watchers = this.watchedFiles.get(path);

      if (watchers === undefined) return;

      const remaining = watchers.filter((watcher) => watcher !== id);
      if (remaining.length === 0) this.watchedFiles.delete(path);
      else this.watchedFiles.set(path, remaining);
    });

    return disposable;
  }

  public stat(uri: Uri): FileStat {
    const exists = this.documents.has(uri.path);

    if (!exists) throw FileSystemError.FileNotFound(uri);

    const { type, ctime, mtime, size } = this.documents.get(uri.path)!;
    return { type, ctime, mtime, size };
  }

  public readFile(uri: Uri): Uint8Array {
    const { content } = this.documents.get(uri.path) ?? {};

    if (content === undefined) throw FileSystemError.FileNotFound(uri);

    return content;
  }

  public writeFile(
    uri: Uri,
    content: Uint8Array,
    { create, overwrite }: { readonly create: boolean; readonly overwrite: boolean }
  ): void {
    const exists = this.documents.has(uri.path);
    const { ctime = Date.now(), type = FileType.File } = this.documents.get(uri.path) ?? {};

    if (!create && !exists) throw FileSystemError.FileNotFound(uri);
    if (create && !overwrite && exists) throw FileSystemError.FileExists(uri);

    this.documents.set(uri.path, { type, ctime, mtime: Date.now(), size: content.byteLength, content });

    if (this.watchedFiles || this.watchAll.length > 0)
      this._onDidChangeFile.fire([{ type: !exists ? FileChangeType.Created : FileChangeType.Changed, uri }]);
  }

  public delete(uri: Uri): void {
    const exists = this.documents.has(uri.path);

    if (!exists) throw FileSystemError.FileNotFound(uri);

    this.documents.delete(uri.path);

    if (this.watchedFiles.has(uri.path) || this.watchAll.length > 0)
      this._onDidChangeFile.fire([{ type: FileChangeType.Deleted, uri }]);
  }

  public copy(source: Uri, destination: Uri, { overwrite }: { readonly overwrite: boolean }): void {
    const exists = this.documents.has(destination.path);
    const original = this.documents.get(source.path);

    if (!original) throw FileSystemError.FileNotFound(source);
    if (exists && !overwrite) throw FileSystemError.FileExists(destination);

    this.documents.set(destination.path, { ...original, ctime: Date.now(), mtime: Date.now(), size: original.size });
    if (this.watchedFiles.has(destination.path) || this.watchAll.length > 0) {
      this._onDidChangeFile.fire([
        { type: exists ? FileChangeType.Changed : FileChangeType.Created, uri: destination },
      ]);
    }
  }

  public rename(oldUri: Uri, newUri: Uri, options: { readonly overwrite: boolean }): void {
    const exists = this.documents.has(newUri.path);
    const original = this.documents.get(oldUri.path);

    if (!original) throw FileSystemError.FileNotFound(oldUri);
    if (exists && !options.overwrite) throw FileSystemError.FileExists(newUri);

    this.documents.delete(oldUri.path);
    this.documents.set(newUri.path, { ...original, mtime: Date.now() });

    if (this.watchedFiles.has(oldUri.path) || this.watchAll.length > 0)
      this._onDidChangeFile.fire([{ type: FileChangeType.Deleted, uri: oldUri }]);
    if (this.watchedFiles.has(newUri.path) || this.watchAll.length > 0)
      this._onDidChangeFile.fire([{ type: exists ? FileChangeType.Changed : FileChangeType.Created, uri: newUri }]);
  }

  public registerSnippetDocument(text: string): Uri {
    const documentId = randomUUID();
    const uri = Uri.parse(`snippet-clipboard:/${documentId}`);
    this.writeFile(uri, Buffer.from(text), { create: true, overwrite: true });

    return uri;
  }

  public dispose() {
    this._onDidChangeFile.dispose();
  }
}
