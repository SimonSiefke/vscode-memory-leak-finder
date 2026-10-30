const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryTreeProvider {
  item = { label: 'Temporary tree item' }
  getChildren(element) {
    return element ? [] : [this.item]
  }
  getTreeItem(element) {
    return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None)
  }
  getParent() {
    return undefined
  }
}
const run = async () => {
  const provider = new TemporaryTreeProvider()
  const view = vscode.window.createTreeView('disposalTreeView', { treeDataProvider: provider })
  try {
    await view.reveal(provider.item, { focus: true, select: true })
  } finally {
    view.dispose()
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('tree-view-registration-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('tree-view-registration-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Tree View Registration Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('tree-view-registration-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Tree View Registration Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('tree-view-registration-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Tree View Registration Disposal: cleanup complete')
    }),
  )
}
