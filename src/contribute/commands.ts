import { commands } from 'vscode';
import { applySelectionTemplates, applySelectionCounter } from '../commands/applySelectionTemplates';
import { copyToSnippet, copyEditToSnippet } from '../commands/copyToSnippet';
import { editClipboardAsSnippet, editSnippetClipboard, clearSnippetClipboard } from '../commands/editSnippetClipboard';
import { pasteAsSnippet, pasteEditAsSnippet } from '../commands/pasteAsSnippet';
import { pasteClipboardSnippet, pasteEditedSnippet, pasteSelectClipboardSnippet, pasteSelectEditedSnippet } from '../commands/pasteClipboardSnippet';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { resetClipboardIndex } from '../commands/resetClipboardIndex';
import { SnippetClipboardContentProvider } from '../providers/SnippetClipboardContentProvider';

export default function contributeCommands (services: SnippetServiceProvider, contentProvider: SnippetClipboardContentProvider) {
  return [
    commands.registerTextEditorCommand('quick-snippets.copyToSnippet', copyToSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.copyEditToSnippet', copyEditToSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteAsSnippet', pasteAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteEditAsSnippet', pasteEditAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteClipboardSnippet', pasteClipboardSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteEditedSnippet', pasteEditedSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteSelectClipboardSnippet', pasteSelectClipboardSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.pasteSelectEditedSnippet', pasteSelectEditedSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.editSnippetClipboard', editSnippetClipboard.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.editClipboardAsSnippet', editClipboardAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.clearSnippetClipboard', clearSnippetClipboard.bind(null, services)),
    commands.registerTextEditorCommand('quick-snippets.applySelectionTemplates', applySelectionTemplates.bind(null, services, contentProvider)),
    commands.registerTextEditorCommand('quick-snippets.applySelectionCounter', applySelectionCounter.bind(null, services, contentProvider)),
    commands.registerTextEditorCommand('quick-snippets.resetClipboardIndex', resetClipboardIndex.bind(null, services)),
  ];
}
