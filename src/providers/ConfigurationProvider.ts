import { Disposable, workspace, WorkspaceConfiguration } from "vscode";

export interface ExtensionConfiguration {
  queryForTemplates: boolean; // Default: true
  queryTemplatesChecked: boolean; // Default: false
  alwaysEditTemplates: boolean; // Default: false
  keepPlaceholders: boolean; // Default: true
  appendToExistingTemplates: boolean; // Default: false
  keepHistory: number; // Default: 10
  reservedWords: string[]; // Reserved word for variable names
  autoTemplate: {
    integers?: boolean; // Default: false
    floats?: boolean; // Default: false
    htmlColors?: boolean; // Default: true
    repeatVars?: boolean | number; // Default: 1
    repeatStrings?: boolean | number; // Default: 1
    repeatSpacedTerms?: boolean | number; // Default: 2
  }
}

export class ConfigurationProvider implements ExtensionConfiguration, Disposable {
  private disposables: Disposable[] = [];
  private config: WorkspaceConfiguration;

  public constructor() {
    this.config = workspace.getConfiguration('snippet-clipboard');
    this.disposables.push(workspace.onDidChangeConfiguration(() => {
      this.config = workspace.getConfiguration('snippet-clipboard');
    }));
  }

  public get queryForTemplates (): boolean {
    return this.config.get('queryForTemplates', true);
  }

  public get queryTemplatesChecked (): boolean {
    return this.config.get('queryTemplatesChecked', false);
  }

  public get alwaysEditTemplates (): boolean {
    return this.config.get('alwaysEditTemplates', false);
  }

  public get keepPlaceholders (): boolean {
    return this.config.get('keepPlaceholders', true);
  }

  public get appendToExistingTemplates (): boolean {
    return this.config.get('appendToExistingTemplates', false);
  }

  public get keepHistory (): number {
    return this.config.get('keepHistory', 10);
  }

  public get reservedWords (): string[] {
    return this.config.get('reservedWords', []);
  }

  public get autoTemplate (): ExtensionConfiguration['autoTemplate'] {
    return this.config.get('autoTemplate', {
      integers: false,
      floats: false,
      htmlColors: true,
      repeatVars: 1,
      repeatStrings: 1,
      repeatSpacedTerms: 2
    });
  }

  public dispose (): void {
    this.disposables.forEach((disposable) => disposable.dispose());
  }
}