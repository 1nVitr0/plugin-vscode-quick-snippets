import { ExtensionContext } from "vscode";
import contributeCommands from "./contribute/commands";
import { SnippetServiceProvider } from './providers/SnippetServiceProvider';
import { ConfigurationProvider } from './providers/ConfigurationProvider';
import { SnippetClipboardContentProvider } from './providers/SnippetClipboardContentProvider';
import { contributeProviders } from "./contribute/contributeProviders";

export function activate (context: ExtensionContext) {
  const configProvider = new ConfigurationProvider();
  const contentProvider = new SnippetClipboardContentProvider();
  const serviceProvider = new SnippetServiceProvider(context, configProvider, contentProvider);

  context.subscriptions.push(
    configProvider,
    serviceProvider,
    ...contributeProviders(contentProvider),
    ...contributeCommands(serviceProvider, contentProvider),
  );
}
