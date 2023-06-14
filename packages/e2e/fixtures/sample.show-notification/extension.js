const vscode = require("vscode");

exports.activate = (context) => {
  const disposable = vscode.commands.registerCommand(
    "extension.helloWorld",
    async () => {
      await vscode.window.showInformationMessage("Hello World!");
    }
  );
  context.subscriptions.push(disposable);
};
