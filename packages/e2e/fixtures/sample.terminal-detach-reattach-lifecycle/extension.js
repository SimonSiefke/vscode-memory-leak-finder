const vscode = require('vscode')

let terminal
let pid
let verify
const setup = async () => {
  terminal = vscode.window.createTerminal({ name: 'Persistent lifecycle terminal' })
  pid = await terminal.processId
  terminal.show(false)
  verify = vscode.commands.registerCommand('terminal-detach-reattach-lifecycle.verify', async () => {
    terminal = vscode.window.activeTerminal
    if (!terminal || (await terminal.processId) !== pid) throw new Error('Reattached terminal process identity changed')
    terminal.sendText('printf persistent-lifecycle-output')
    void vscode.window.showInformationMessage('Persistent terminal identity verified')
  })
}
const run = async () => {
  terminal.show(false)
  await vscode.commands.executeCommand('workbench.action.terminal.detachSession')
}
const cleanup = () => {
  terminal?.dispose()
  terminal = undefined
  verify?.dispose()
  verify = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-detach-reattach-lifecycle.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-detach-reattach-lifecycle.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Detach Reattach Lifecycle: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-detach-reattach-lifecycle.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Terminal Detach Reattach Lifecycle: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-detach-reattach-lifecycle.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Detach Reattach Lifecycle: cleanup complete')
    }),
  )
}
