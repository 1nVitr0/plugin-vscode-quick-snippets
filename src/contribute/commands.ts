import { commands } from 'vscode';
import { applySelectionTemplates } from '../commands/applySelectionTemplates';
import { copyToSnippet, copyEditToSnippet } from '../commands/copyToSnippet';
import { editClipboardAsSnippet, editSnippetClipboard, clearSnippetClipboard } from '../commands/editSnippetClipboard';
import { pasteAsSnippet, pasteEditAsSnippet } from '../commands/pasteAsSnippet';
import { pasteClipboardSnippet, pasteEditedSnippet, pasteSelectClipboardSnippet, pasteSelectEditedSnippet } from '../commands/pasteClipboardSnippet';
import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';

export default function contributeCommands (serviceProvider: SnippetServiceProvider) {
  return [
    commands.registerTextEditorCommand('quick-snippets.copyToSnippet', copyToSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.copyEditToSnippet', copyEditToSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteAsSnippet', pasteAsSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteEditAsSnippet', pasteEditAsSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteClipboardSnippet', pasteClipboardSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteEditedSnippet', pasteEditedSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteSelectClipboardSnippet', pasteSelectClipboardSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.pasteSelectEditedSnippet', pasteSelectEditedSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.editSnippetClipboard', editSnippetClipboard.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.editClipboardAsSnippet', editClipboardAsSnippet.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.clearSnippetClipboard', clearSnippetClipboard.bind(null, serviceProvider)),
    commands.registerTextEditorCommand('quick-snippets.applySelectionTemplates', applySelectionTemplates.bind(null, serviceProvider))
  ];
}
