const vscode = require('vscode')

const itemCount = 12000
const refreshCount = 20

const createItems = () => Array.from({ length: itemCount }, (_, index) => ({ id: `tree-item-${index}`, label: `Tree item ${index}` }))

let view
let provider

class RefreshingTreeProvider {
  constructor() {
    this.emitter = new vscode.EventEmitter()
    this.onDidChangeTreeData = this.emitter.event
    this.items = createItems()
    this.pendingRefreshes = []
  }

  getChildren(element) {
    if (element) return []
    const completeRefresh = this.pendingRefreshes.shift()
    if (completeRefresh) this.items = createItems()
    if (completeRefresh) completeRefresh()
    return this.items
  }

  getTreeItem(element) {
    return new vscode.TreeItem(element.label, vscode.TreeItemCollapsibleState.None)
  }

  refresh() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRefreshes = this.pendingRefreshes.filter((complete) => complete !== finish)
        reject(new Error('The tree view did not request its children after a refresh'))
      }, 15000)
      const finish = () => {
        clearTimeout(timeout)
        resolve()
      }
      this.pendingRefreshes.push(finish)
      this.emitter.fire(undefined)
    }).then(async () => {
      await view.reveal(this.items[this.items.length - 1], { focus: false, select: false })
    })
  }

  dispose() {
    this.emitter.dispose()
    this.pendingRefreshes.length = 0
  }
}

const cleanup = () => {
  view?.dispose()
  view = undefined
  provider?.dispose()
  provider = undefined
}

const setup = async () => {
  cleanup()
  provider = new RefreshingTreeProvider()
  view = vscode.window.createTreeView('treeViewRefreshLifecycleChurn', { treeDataProvider: provider })
  await view.reveal(provider.items[0], { focus: true, select: false })
}

const run = async () => {
  if (!view || !provider) throw new Error('The tree view must be set up before running refresh churn')
  for (let index = 0; index < refreshCount; index++) {
    await provider.refresh()
  }
}

exports.activate = (context) => {
  context.subscriptions.push(
    { dispose: cleanup },
    vscode.commands.registerCommand('tree-view-refresh-lifecycle-churn.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Tree View Refresh Lifecycle Churn: setup complete')
    }),
    vscode.commands.registerCommand('tree-view-refresh-lifecycle-churn.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Tree View Refresh Lifecycle Churn: run complete')
    }),
    vscode.commands.registerCommand('tree-view-refresh-lifecycle-churn.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Tree View Refresh Lifecycle Churn: cleanup complete')
    }),
  )
}
