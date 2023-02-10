import { ExtensionContext, workspace } from "vscode";
import contributeCommands from "./contribute/commands";
import { SnippetServiceProvider } from './providers/SnippetServiceProvider';

export function activate (context: ExtensionContext) {
  const serviceProvider = new SnippetServiceProvider(context);

  context.subscriptions.push(
    ...contributeCommands(serviceProvider),
  );
  context.subscriptions.push(
    workspace.onDidChangeConfiguration((change) => {
      // TODO: Handle configuration changes
    })
  );
}
