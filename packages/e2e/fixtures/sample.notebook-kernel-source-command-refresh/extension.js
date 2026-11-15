const vscode = require('vscode')

let serializer
let provider
let command
let changed
let version = 0
let executed = 0
class KernelCommandArgument {
  constructor(value) {
    this.value = value
  }
}
const setup = async () => {
  serializer = vscode.workspace.registerNotebookSerializer('lifecycle-kernel-source', {
    deserializeNotebook: () => new vscode.NotebookData([]),
    serializeNotebook: () => new Uint8Array(),
  })
  changed = new vscode.EventEmitter()
  provider = vscode.notebooks.registerKernelSourceActionProvider('lifecycle-kernel-source', {
    onDidChangeNotebookKernelSourceActions: changed.event,
    provideNotebookKernelSourceActions: () => [
      {
        label: 'Lifecycle Kernel Source',
        command: {
          command: 'notebook-kernel-source-command-refresh.execute',
          title: 'Lifecycle Kernel Source',
          arguments: [new KernelCommandArgument(version)],
        },
      },
    ],
  })
  command = vscode.commands.registerCommand('notebook-kernel-source-command-refresh.execute', (argument) => {
    if (!(argument instanceof KernelCommandArgument) || argument.value !== version)
      throw new Error('Kernel source command argument is stale')
    executed = version
    void vscode.window.showInformationMessage('Kernel source command executed')
    return undefined
  })
  const document = await vscode.workspace.openNotebookDocument(
    'lifecycle-kernel-source',
    new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
  )
  await vscode.window.showNotebookDocument(document)
}
const run = () => {
  if (version && executed !== version) throw new Error('Previous kernel command was not executed')
  version++
  changed.fire()
  void vscode.commands.executeCommand('notebook.selectKernel', { notebookEditor: vscode.window.activeNotebookEditor })
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  changed?.dispose()
  changed = undefined
  command?.dispose()
  command = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  serializer?.dispose()
  serializer = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('notebook-kernel-source-command-refresh.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-kernel-source-command-refresh.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Notebook Kernel Source Command Refresh: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-kernel-source-command-refresh.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Notebook Kernel Source Command Refresh: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-kernel-source-command-refresh.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Kernel Source Command Refresh: cleanup complete')
    }),
  )
}
