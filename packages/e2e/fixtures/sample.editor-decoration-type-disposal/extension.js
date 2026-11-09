const vscode = require('vscode')

let editor
const setup = async () => {
  editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Decorated text' }),
  )
}
const run = () => {
  if (!editor) throw new Error('Editor not initialized')
  const decoration = vscode.window.createTextEditorDecorationType({ backgroundColor: '#ff000044' })
  try {
    editor.setDecorations(decoration, [new vscode.Range(0, 0, 0, 5)])
  } finally {
    decoration.dispose()
  }
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  editor = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('editor-decoration-type-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-decoration-type-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Editor Decoration Type Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-decoration-type-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Editor Decoration Type Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('editor-decoration-type-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Editor Decoration Type Disposal: cleanup complete')
    }),
  )
}
