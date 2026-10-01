const vscode = require('vscode')

let oldReplies
let anchor
let terminal
let iteration = 0
const setup = async () => {
  oldReplies = vscode.workspace.getConfiguration('terminal.integrated').inspect('autoReplies')?.workspaceValue
  anchor = vscode.window.createTerminal({ name: 'Auto reply anchor' })
}
const run = async () => {
  const prompt = `LIFECYCLE_REPLY_${++iteration}`
  const config = vscode.workspace.getConfiguration('terminal.integrated')
  await config.update('autoReplies', { [prompt]: 'obsolete-reply\r' }, vscode.ConfigurationTarget.Workspace)
  await config.update('autoReplies', {}, vscode.ConfigurationTarget.Workspace)
  terminal = vscode.window.createTerminal({ name: 'Removed auto reply', shellPath: '/bin/bash' })
  terminal.show(true)
  await terminal.processId
  terminal.sendText(
    `printf 'LIFECYCLE_%s' 'REPLY_${iteration}'; read -r -t 1 reply; printf 'REPLY_RESULT_${iteration}:%s\\n' "\${reply:-NO_REPLY}"`,
  )
}
const close = async () => {
  let listener
  let timeout
  try {
    await new Promise((resolve, reject) => {
      listener = vscode.window.onDidCloseTerminal((closed) => {
        if (closed === terminal) resolve()
      })
      timeout = setTimeout(() => reject(new Error('Auto reply terminal did not close')), 7000)
      terminal.dispose()
    })
  } finally {
    clearTimeout(timeout)
    listener.dispose()
    terminal = undefined
  }
}
const cleanup = async () => {
  terminal?.dispose()
  terminal = undefined
  anchor?.dispose()
  anchor = undefined
  await vscode.workspace.getConfiguration('terminal.integrated').update('autoReplies', oldReplies, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-auto-reply-removal.close', async () => {
      await close()
      void vscode.window.showInformationMessage('Auto reply terminal closed')
    }),
  )
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-auto-reply-removal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-auto-reply-removal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Auto Reply Removal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-auto-reply-removal.run', async () => {
      try {
        await run()
      } catch (error) {
        void vscode.window.showInformationMessage(String(error))
        throw error
      }
      void vscode.window.showInformationMessage('Terminal Auto Reply Removal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-auto-reply-removal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Auto Reply Removal: cleanup complete')
    }),
  )
}
