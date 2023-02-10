import { DynamicSnippetService } from "../services/DynamicSnippetService";
import { SnippetClipboardService } from "../services/SnippetClipboardProvider";
import { SnippetEditorService } from "../services/SnippetEditorProvider";
import { ExtensionContext } from 'vscode';

export class SnippetServiceProvider {
  public readonly dynamicSnippet: DynamicSnippetService;
  public readonly clipboard: SnippetClipboardService;
  public readonly editor: SnippetEditorService;

  public constructor(context: ExtensionContext) {
    this.dynamicSnippet = new DynamicSnippetService();
    this.clipboard = new SnippetClipboardService(context);
    this.editor = new SnippetEditorService();
  }
}