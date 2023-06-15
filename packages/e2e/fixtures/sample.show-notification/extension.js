const vscode = require("vscode");

const showNotification = async () => {
  await vscode.window.showInformationMessage("Hello World!");
};

exports.activate = () => {
  vscode.commands.registerCommand("extension.helloWorld", showNotification);
};
