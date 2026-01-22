const vscode = require('vscode')

const showNotificationStorm = async () => {
  // Send 50 notifications
  for (let i = 1; i <= 50; i++) {
    await vscode.window.showInformationMessage(`Notification ${i} of 50`)
  }
}

exports.activate = () => {
  vscode.commands.registerCommand('extension.notificationStorm', showNotificationStorm)
}
