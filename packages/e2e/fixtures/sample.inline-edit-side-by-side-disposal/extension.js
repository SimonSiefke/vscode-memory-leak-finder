const vscode = require('vscode')

let provider
let armed = false
let previous
const setup = async () => {
  previous = vscode.workspace.getConfiguration('editor.inlineSuggest.edits').inspect('renderSideBySide')?.workspaceValue
  await vscode.workspace
    .getConfiguration('editor.inlineSuggest.edits')
    .update('renderSideBySide', 'auto', vscode.ConfigurationTarget.Workspace)
  provider = vscode.languages.registerInlineCompletionItemProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideInlineCompletionItems: () =>
        armed
          ? [
              {
                insertText: 'function replacement() {\n  const revised = true;\n  return revised;\n}',
                range: new vscode.Range(0, 0, 3, 1),
                isInlineEdit: true,
              },
            ]
          : [],
    },
  )
  await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({
      language: 'plaintext',
      content: 'function original() {\n  const old = false;\n  return old;\n}',
    }),
  )
}
const run = async () => {
  armed = true
  await vscode.commands.executeCommand('editor.action.inlineSuggest.trigger')
}
const cleanup = async () => {
  armed = false
  provider?.dispose()
  provider = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  await vscode.workspace
    .getConfiguration('editor.inlineSuggest.edits')
    .update('renderSideBySide', previous, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-edit-side-by-side-disposal.hide', async () => {
      armed = false
      await vscode.commands.executeCommand('editor.action.inlineSuggest.hide')
      void vscode.window.showInformationMessage('Lifecycle inline edit dismissed')
    }),
  )
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('inline-edit-side-by-side-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-edit-side-by-side-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Inline Edit Side By Side Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-edit-side-by-side-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Inline Edit Side By Side Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inline-edit-side-by-side-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Inline Edit Side By Side Disposal: cleanup complete')
    }),
  )
}
