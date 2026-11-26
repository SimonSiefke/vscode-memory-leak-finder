const vscode = require('vscode')

let serializer
let provider
let changed
let document
let ready
let version = 0
class CellStatusArgument {
  constructor(value) {
    this.value = value
  }
}
const setup = async () => {
  serializer = vscode.workspace.registerNotebookSerializer('lifecycle-cell-status', {
    deserializeNotebook: () => new vscode.NotebookData([]),
    serializeNotebook: () => new Uint8Array(),
  })
  changed = new vscode.EventEmitter()
  provider = vscode.notebooks.registerNotebookCellStatusBarItemProvider('lifecycle-cell-status', {
    onDidChangeCellStatusBarItems: changed.event,
    provideCellStatusBarItems() {
      const item = new vscode.NotebookCellStatusBarItem(`Lifecycle status ${version}`, vscode.NotebookCellStatusBarAlignment.Left)
      item.command = {
        command: 'notebook-cell-status-command-refresh.noop',
        title: 'Status command',
        arguments: [new CellStatusArgument(version)],
      }
      ready?.()
      return [item]
    },
  })
  document = await vscode.workspace.openNotebookDocument(
    'lifecycle-cell-status',
    new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
  )
  await vscode.window.showNotebookDocument(document)
}
const run = async () => {
  let timeout
  const requested = new Promise((resolve, reject) => {
    ready = resolve
    timeout = setTimeout(() => reject(new Error('Cell status refresh was not requested')), 7000)
  })
  try {
    version++
    changed.fire()
    await requested
    await vscode.commands.executeCommand('setContext', 'notebook-cell-status-command-refresh.version', version)
  } finally {
    clearTimeout(timeout)
    ready = undefined
  }
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  changed?.dispose()
  changed = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  serializer?.dispose()
  serializer = undefined
  document = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('notebook-cell-status-command-refresh.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-cell-status-command-refresh.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Notebook Cell Status Command Refresh: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-cell-status-command-refresh.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Notebook Cell Status Command Refresh: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-cell-status-command-refresh.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Cell Status Command Refresh: cleanup complete')
    }),
  )
}
