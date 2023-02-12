# Quick Snippets

[![Visual Studio Code extension 1nVitr0.quick-snippets](https://img.shields.io/visual-studio-marketplace/v/1nVitr0.quick-snippets?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=1nVitr0.quick-snippets)
[![Installs for Visual Studio Code extension 1nVitr0.quick-snippets](https://img.shields.io/visual-studio-marketplace/i/1nVitr0.quick-snippets?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=1nVitr0.quick-snippets)
[![Rating for Visual Studio Code extension 1nVitr0.quick-snippets](https://img.shields.io/visual-studio-marketplace/r/1nVitr0.quick-snippets?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=1nVitr0.quick-snippets)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

![Copy Paste with smarts!](https://raw.githubusercontent.com/1nVitr0/plugin-vscode-quick-snippets/main/resources/demo.gif)

Copy Paste with smarts! Copy and paste code as vscode snippets, saving you time and copy-paste errors.

### Table of Contents

- [Features](#features)
- [Commands](#commands)
- [Extension Settings](#extension-settings)
- [Known Issues](#known-issues)
- [Contributors](#contributors)

***

## Features

The extension adds commands for quickly copying and pasting code as a snippet. Snippets allow you to add templates, that can be replaced when inserting, simply by tabbing through each of them. Additionally it adds some extra functionality around snippets:

- Creating snippets from the current selection (with multi cursor support)
- Creating snippets from the current clipboard content
- Editing sippets before pasting them
- Pasting snippets with templates that automatically increment / decrement a value
- Paste previous snippets again (History size can be adjusted and works across windows)

***

## Commands

<details>
<summary>This extension contributes the following commands:</summary>

`Quick Snippets: Copy as snippet`: Copy the current selection to a snippet

`Quick Snippets: Copy and Edit as Snippet`: Copy the current selection to a snippet and open an editor

`Quick Snippets: Paste as Snippet`: Paste the current clipboard as a snippet

`Quick Snippets: Paste last Snippet`: Paste the last snippet again

`Quick Snippets: Paste a previous Snippet`: Select and paste a previous Snippet

`Quick Snippets: Edit last Snippet`: Edit the last snippet

`Quick Snippets: Edit Clipboard as Snippet`: Edit the current clipboard as a snippet

`Quick Snippets: Edit and Paste as Snippet`: Edit the current clipboard and paste as snippet

`Quick Snippets: Edit and Paste last snippet`: Edit the last snippet and paste it

`Quick Snippets: Edit and Paste a previous snippet`: Select, edit and paste a previous Snippet

`Quick Snippets: Convert Selection to Templates`: Convert the currently selected keyword(s) to a snippet template

`Quick Snippets: Clear Snippet Clipboard`: Clear the snippet history

`Quick Snippets: Reset Clipboard Index`: Reset the incrementing counter for the current clipboard

</details>

***

## Extension Settings

<details>
<summary>This extension contributed the following settings:</summary>


`quick-snippets.queryForTemplates`: Query for templates when creating snippets

`quick-snippets.queryTemplatesChecked`: Check all templates by default when querying

`quick-snippets.alwaysEditTemplates`: Always edit templates when creating snippets

`quick-snippets.keepPlaceholders`: Keep original as placeholders when creating templates

`quick-snippets.appendToExistingTemplates`: Append to existing templates when creating snippets

`quick-snippets.reservedWords`: Reserved words that do not create variable templates

`quick-snippets.autoTemplate`: List of types to automatically convert to templates when creating snippets

</details>

***

## Known Issues

- keywords can be detected as variables when creating snippets with automatic templates. Use `quick-snippets.reservedWords` to exclude specific keywords.

***

## Contributors

This theme is maintained by the following person:

[![Aram Becker](https://avatars.githubusercontent.com/u/15647636?v=4&s=72)](https://github.com/1nVitr0) |
:---: |
[Aram Becker](https://github.com/1nVitr0) |
