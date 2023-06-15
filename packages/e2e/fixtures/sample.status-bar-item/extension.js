const vscode = require("vscode");

const createStatusBarItem = () => {
  const sbItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    1
  );
  sbItem.text = "0";
  sbItem.tooltip = "Counter";
  sbItem.command = "code-boilerplate.CodeBoilerPlate";
  sbItem.show();
  return sbItem;
};

exports.activate = async () => {
  const item = createStatusBarItem();
  let incrementing = true;
  vscode.commands.registerCommand("code-boilerplate.CodeBoilerPlate", () => {
    const current = parseInt(item.text);
    const next = incrementing ? current + 1 : current - 1;
    item.text = `${next}`;
    if (current === 0) {
      incrementing = true;
    }
    if (current === 2) {
      incrementing = false;
    }
  });
};
