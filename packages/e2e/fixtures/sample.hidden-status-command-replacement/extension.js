const vscode = require('vscode')

let hiddenStatus

class HiddenCommandArgument {
  constructor() {
    this.value = 'hidden command payload'
  }
}

const cleanup = () => {
  hiddenStatus?.dispose()
  hiddenStatus = undefined
}

const run = () => {
  hiddenStatus ??= vscode.window.createStatusBarItem('lifecycle-hidden-command', vscode.StatusBarAlignment.Left)
  // Keep the item hidden and alive across iterations: showing or disposing it
  // here would clean up the stale command registrations under investigation.
  hiddenStatus.command = {
    command: 'hidden_status_command_replacement.noop',
    title: 'Hidden command',
    arguments: [new HiddenCommandArgument()],
  }
}

exports.activate = (context) => {
  context.subscriptions.push(
    { dispose: cleanup },
    vscode.commands.registerCommand('hidden_status_command_replacement.noop', () => {}),
    vscode.commands.registerCommand('hidden_status_command_replacement.run', async () => {
      await run()
      // Signal completion without waiting for notification dismissal.
      void vscode.window.showInformationMessage('Hidden Status Command complete')
    }),
    vscode.commands.registerCommand('hidden_status_command_replacement.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Hidden Status Command cleanup complete')
    }),
  )
}
