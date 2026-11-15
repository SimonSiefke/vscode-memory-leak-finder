const vscode = require('vscode')

const setup = async () => {
  if (!vscode.window.activeNotebookEditor) {
    const document = await vscode.workspace.openNotebookDocument(
      'restart-status',
      new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
    )
    await vscode.window.showNotebookDocument(document)
  }
}
const run = () => {
  for (let index = 0; index < 1; index++) void vscode.commands.executeCommand('workbench.action.restartExtensionHost')
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000)
  status.text = `Lifecycle host ${process.pid}`
  status.show()
  context.subscriptions.push(status)

  context.subscriptions.push(
    vscode.workspace.registerNotebookSerializer('restart-status', {
      deserializeNotebook: () =>
        new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
      serializeNotebook: () => new Uint8Array(),
    }),
  )
  context.subscriptions.push(
    vscode.notebooks.registerNotebookCellStatusBarItemProvider('restart-status', {
      provideCellStatusBarItems: () => [
        new vscode.NotebookCellStatusBarItem(`Host ${process.pid}`, vscode.NotebookCellStatusBarAlignment.Left),
      ],
    }),
  )

  context.subscriptions.push(vscode.commands.registerCommand('notebook-status-provider-host-restart.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-status-provider-host-restart.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Notebook Status Provider Host Restart: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-status-provider-host-restart.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Notebook Status Provider Host Restart: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-status-provider-host-restart.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Status Provider Host Restart: cleanup complete')
    }),
  )
}
