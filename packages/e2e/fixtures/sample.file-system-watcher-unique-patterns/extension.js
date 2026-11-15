const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

let iteration = 0
const run = () => {
  const watcher = vscode.workspace.createFileSystemWatcher(`**/disposal-${++iteration}/**/*.txt`)
  watcher.dispose()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('file-system-watcher-unique-patterns.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('file-system-watcher-unique-patterns.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('File System Watcher Unique Patterns: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('file-system-watcher-unique-patterns.run', async () => {
      await run()
      void vscode.window.showInformationMessage('File System Watcher Unique Patterns: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('file-system-watcher-unique-patterns.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('File System Watcher Unique Patterns: cleanup complete')
    }),
  )
}
