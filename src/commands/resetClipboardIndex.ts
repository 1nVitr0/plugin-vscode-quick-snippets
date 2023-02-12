import { SnippetServiceProvider } from '../providers/SnippetServiceProvider';

export function resetClipboardIndex (services: SnippetServiceProvider) {
  services.clipboard.resetPasteCount();
}