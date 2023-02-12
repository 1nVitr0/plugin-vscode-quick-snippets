import { Disposable, TabInputText, TextEditor, Uri, window } from 'vscode';

export async function interceptEditorWithText (text: string, openCallback: () => void, timeout = 1000) {
  let listener: Disposable | null = null;
  const editorPromise = new Promise<TextEditor>(resolve => {
    listener = window.onDidChangeVisibleTextEditors(editors => {
      for (const editor of editors) {
        if (editor.document.getText()) {
          listener?.dispose();
          resolve(editor);
        }
      }
    });
  });

  openCallback();

  const textEditor = await Promise.race([
    editorPromise,
    new Promise<void>(resolve => setTimeout(resolve, 1000)),
  ]);
  if (listener) (listener as Disposable).dispose();

  return textEditor;
}

export async function closeEditor (editor: TextEditor) {
  const { activeTabGroup } = window.tabGroups;
  const tabs = activeTabGroup?.tabs.filter(({ input }) => {
    return input instanceof TabInputText && input.uri.toString() === editor.document.uri.toString();
  });

  if (tabs?.length) await window.tabGroups.close(tabs);
}