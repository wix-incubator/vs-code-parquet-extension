// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ParquetEditorProvider } from './parquet-editor-provider';
import { readParquetFile } from './parquetReader';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "helloworld" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  let disposable = vscode.commands.registerCommand(
    'helloworld.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      const activeTabInput = vscode.window.tabGroups.activeTabGroup.activeTab
        ?.input as { [key: string]: any; uri: vscode.Uri | undefined };
      console.log({ activeTabInput, uri: activeTabInput.uri });
      readParquetFile('examples/simple.parquet')
        .then(() => {
          vscode.window.showInformationMessage('Hello VS Code!');
        })
        .catch(() =>
          vscode.window.showErrorMessage('Oh noe, something happened')
        );
    }
  );

  context.subscriptions.push(ParquetEditorProvider.register(context));
}

// this method is called when your extension is deactivated
export function deactivate() {}
