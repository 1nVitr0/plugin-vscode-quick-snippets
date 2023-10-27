import * as assert from "assert";
import { Selection, window, workspace } from "vscode";
import { ExtensionConfiguration } from "../../providers/ConfigurationProvider";
import { SnippetClipboardFileSystemProvider } from "../../providers/SnippetClipboardFileSystemProvider";
import { SnippetEditorService } from "../../services/SnippetEditorService";

suite("Unit Suite for SnippetEditorProvider", async () => {
  window.showInformationMessage("Start tests for SnippetEditorProvider.");

  const config: ExtensionConfiguration = {
    alwaysEditTemplates: false,
    keepPlaceholders: false,
    queryForTemplates: false,
    queryTemplatesChecked: false,
    appendToExistingTemplates: false,
    keepHistory: 1,
    reservedWords: [],
    autoTemplate: {
      floats: false,
      htmlColors: false,
      integers: false,
      repeatStrings: false,
      repeatVars: false,
    },
  };
  const fileSystemProvider = new SnippetClipboardFileSystemProvider();
  const editor = new SnippetEditorService(config, fileSystemProvider);

  // test("Opens editor", async () => {
  //   const text = "test";
  //   const editorPromise = interceptEditorWithText(text, () => editor.provideEditorEditedSnippet(text));
  //   editor.provideEditorEditedSnippet(text);

  //   const textEditor = await editorPromise;
  //   assert.strictEqual(textEditor?.document.getText(), text);
  //   await closeEditor(textEditor);
  // });

  // test("Returns edited content", async () => {
  //   const text = "edit test";
  //   const editorPromise = interceptEditorWithText(text, () => editor.provideEditorEditedSnippet(text));
  //   const editedPromise = editor.provideEditorEditedSnippet(text);

  //   const textEditor = await editorPromise;

  //   if (textEditor) {
  //     const edit = new WorkspaceEdit();
  //     edit.insert(textEditor.document.uri, new Position(0, 0), "edited ");
  //     await workspace.applyEdit(edit);
  //     await closeEditor(textEditor);
  //   }

  //   const edited = await editedPromise;
  //   assert.strictEqual(edited?.value, "edited edit test");
  // });

  test("Replaces single template", async () => {
    const text = "edit test";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selection = new Selection(0, 5, 0, text.length);
      config.keepPlaceholders = false;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit $1");
  });

  test("Replaces single template with placeholder", async () => {
    const text = "edit test";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selection = new Selection(0, 5, 0, text.length);
      config.keepPlaceholders = true;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit ${1:test}");
  });

  test("Replaces multiple templates", async () => {
    const text = "edit test test different";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selections = [new Selection(0, 5, 0, 9), new Selection(0, 10, 0, 14), new Selection(0, 15, 0, 24)];
      config.keepPlaceholders = false;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit $1 $1 $2");
  });

  test("Replaces multiple templates with placeholder", async () => {
    const text = "edit test test different";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selections = [new Selection(0, 5, 0, 9), new Selection(0, 10, 0, 14), new Selection(0, 15, 0, 24)];
      config.keepPlaceholders = true;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit ${1:test} ${1:test} ${2:different}");
  });

  test("Appends to existing template", async () => {
    const text = "edit test $1 ${2:test}";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selection = new Selection(0, 5, 0, 9);
      config.keepPlaceholders = true;
      config.appendToExistingTemplates = true;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit ${2:test} $1 ${2:test}");
  });

  test("Increments index with existing template", async () => {
    const text = "edit test $1";
    const document = await workspace.openTextDocument({ content: text });
    const textEditor = await window.showTextDocument(document);

    if (textEditor) {
      textEditor.selection = new Selection(0, 5, 0, 9);
      config.keepPlaceholders = false;
      config.appendToExistingTemplates = false;
      await textEditor.edit((edit) => editor.applySelectionTemplates(textEditor, edit));
    }

    assert.strictEqual(textEditor?.document.getText(), "edit $2 $1");
  });
});
