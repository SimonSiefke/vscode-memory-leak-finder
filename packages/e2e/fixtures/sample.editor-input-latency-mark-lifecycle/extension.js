const vscode = require('vscode')

const setup = async () => {
  const editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Input latency\n'.repeat(300) }),
  )
  editor.selection = new vscode.Selection(0, 0, 0, 0)
}
const run = () => {}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('editor-input-latency-mark-lifecycle.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-input-latency-mark-lifecycle.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Editor Input Latency Mark Lifecycle: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-input-latency-mark-lifecycle.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Editor Input Latency Mark Lifecycle: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-input-latency-mark-lifecycle.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Editor Input Latency Mark Lifecycle: cleanup complete')
    }),
  )
}
