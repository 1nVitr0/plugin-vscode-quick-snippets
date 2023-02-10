import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { TextEditor, TextEditorEdit } from 'vscode';

export async function applySelectionTemplates (
  serviceProvider: SnippetServiceProvider,
  editor: TextEditor,
  edit: TextEditorEdit
) {
  serviceProvider.editor.applySelectionTemplates(editor, edit);
}