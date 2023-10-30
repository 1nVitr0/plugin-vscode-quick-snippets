import { ExtensionContext } from "vscode";
import contributeCommands from "./contribute/commands";
import { SnippetServiceProvider } from './providers/SnippetServiceProvider';
import { ConfigurationProvider } from './providers/ConfigurationProvider';
import { contributeProviders } from "./contribute/contributeProviders";
import { SnippetClipboardFileSystemProvider } from "./providers/SnippetClipboardFileSystemProvider";

export function activate (context: ExtensionContext) {
  const configProvider = new ConfigurationProvider();
  const fileSystemProvider = new SnippetClipboardFileSystemProvider();
  const serviceProvider = new SnippetServiceProvider(context, configProvider, fileSystemProvider);

  context.subscriptions.push(
    configProvider,
    serviceProvider,
    ...contributeProviders(fileSystemProvider),
    ...contributeCommands(serviceProvider),
  );
}
