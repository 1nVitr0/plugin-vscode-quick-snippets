import { commands } from 'vscode';
import { applySelectionTemplates, applySelectionCounter } from '../commands/applySelectionTemplates';
import { copyToSnippet, copyEditToSnippet } from '../commands/copyToSnippet';
import { editClipboardAsSnippet, editSnippetClipboard, clearSnippetClipboard, editSelectSnippetClipboard } from '../commands/editSnippetClipboard';
import { pasteAsSnippet, pasteEditAsSnippet } from '../commands/pasteAsSnippet';
import { pasteClipboardSnippet, pasteEditedSnippet, pasteSelectClipboardSnippet, pasteSelectEditedSnippet } from '../commands/pasteClipboardSnippet';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';
import { resetClipboardIndex } from '../commands/resetClipboardIndex';
import { SnippetClipboardContentProvider } from '../providers/SnippetClipboardContentProvider';

export default function contributeCommands (services: SnippetServiceProvider, contentProvider: SnippetClipboardContentProvider) {
  return [
    commands.registerTextEditorCommand('snippet-clipboard.copyToSnippet', copyToSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.copyEditToSnippet', copyEditToSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteAsSnippet', pasteAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteEditAsSnippet', pasteEditAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteClipboardSnippet', pasteClipboardSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteEditedSnippet', pasteEditedSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteSelectClipboardSnippet', pasteSelectClipboardSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.pasteSelectEditedSnippet', pasteSelectEditedSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.editSnippetClipboard', editSnippetClipboard.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.editSelectSnippetClipboard', editSelectSnippetClipboard.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.editClipboardAsSnippet', editClipboardAsSnippet.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.clearSnippetClipboard', clearSnippetClipboard.bind(null, services)),
    commands.registerTextEditorCommand('snippet-clipboard.applySelectionTemplates', applySelectionTemplates.bind(null, services, contentProvider)),
    commands.registerTextEditorCommand('snippet-clipboard.applySelectionCounter', applySelectionCounter.bind(null, services, contentProvider)),
    commands.registerTextEditorCommand('snippet-clipboard.resetClipboardIndex', resetClipboardIndex.bind(null, services)),
  ];
}
