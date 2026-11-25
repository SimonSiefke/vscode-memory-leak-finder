const vscode = require('vscode')

const prefix = 'Webview View Visibility Churn'
const viewId = 'webviewViewVisibilityChurn.view'
const homeContainerId = 'workbench.view.extension.webviewViewVisibilityChurn'
const panelContainerId = 'workbench.view.extension.webviewViewVisibilityChurnDock'
const timeoutMs = 7000

// Lifetime counters. They are never reset, so the invariants hold across cycles.
const state = {
  disposals: 0,
  hiddenEvents: 0,
  readies: 0,
  resolves: 0,
  shownEvents: 0,
  staleReadies: 0,
  view: undefined,
}
// Counter values already consumed by an Expect command.
const accepted = {
  disposals: 0,
  hiddenEvents: 0,
  readies: 0,
}
const waiters = new Set()

const describe = () => {
  const view = state.view
  return `resolves=${state.resolves} disposals=${state.disposals} readies=${state.readies} stale=${state.staleReadies} shown=${state.shownEvents} hidden=${state.hiddenEvents} view=${view ? (view.visible ? 'visible' : 'hidden') : 'none'}`
}

const changed = () => {
  for (const waiter of [...waiters]) {
    waiter()
  }
}

const waitFor = (description, predicate) => {
  return new Promise((resolve, reject) => {
    let timer
    const check = () => {
      if (predicate()) {
        clearTimeout(timer)
        waiters.delete(check)
        resolve()
      }
    }
    timer = setTimeout(() => {
      waiters.delete(check)
      reject(new Error(`${description} timed out (${describe()})`))
    }, timeoutMs)
    waiters.add(check)
    check()
  })
}

const checkInvariants = () => {
  // Without retained context a pane owns at most one live webview view.
  if (state.resolves - state.disposals > 1) {
    throw new Error(`more than one live webview view (${describe()})`)
  }
}

const isHidden = () => !state.view || !state.view.visible

const getNonce = () => {
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }
  return text
}

const getHtml = (webview, resolveNumber) => {
  const nonce = getNonce()
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
<title>Churn Webview</title>
</head>
<body>
<h1 id="churn-status">Churn webview resolve ${resolveNumber}</h1>
<script nonce="${nonce}">
acquireVsCodeApi().postMessage({ type: 'ready' })
</script>
</body>
</html>`
}

const provider = {
  resolveWebviewView(webviewView) {
    state.resolves++
    state.view = webviewView
    const disposables = []
    webviewView.webview.options = { enableScripts: true, localResourceRoots: [] }
    disposables.push(
      webviewView.webview.onDidReceiveMessage((message) => {
        if (!message || message.type !== 'ready') {
          return
        }
        // A load that raced a hide must not satisfy the next show.
        if (state.view === webviewView && webviewView.visible) {
          state.readies++
        } else {
          state.staleReadies++
        }
        changed()
      }),
    )
    disposables.push(
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          state.shownEvents++
        } else {
          state.hiddenEvents++
        }
        changed()
      }),
    )
    disposables.push(
      webviewView.onDidDispose(() => {
        state.disposals++
        if (state.view === webviewView) {
          state.view = undefined
        }
        for (const disposable of disposables.splice(0)) {
          disposable.dispose()
        }
        changed()
      }),
    )
    webviewView.webview.html = getHtml(webviewView.webview, state.resolves)
    changed()
  },
}

// Container the fixture last moved the view to; undefined until Setup.
let containerId

// Moving a view also opens and focuses the destination container.
const moveTo = async (destinationId) => {
  await vscode.commands.executeCommand('vscode.moveViews', { viewIds: [viewId], destinationId })
  containerId = destinationId
}

const hideView = async () => {
  await vscode.commands.executeCommand('workbench.view.explorer')
  await waitFor('hide', isHidden)
  accepted.disposals = state.disposals
  accepted.hiddenEvents = state.hiddenEvents
  accepted.readies = state.readies
  checkInvariants()
}

const setup = async () => {
  // View locations persist in the profile, so always start from the home container.
  await moveTo(homeContainerId)
  await hideView()
}

const expectReady = async () => {
  await waitFor('ready', () => !!state.view && state.view.visible && state.readies > accepted.readies)
  accepted.readies = state.readies
  checkInvariants()
}

const expectHidden = async () => {
  await waitFor('hidden', () => isHidden() && (state.hiddenEvents > accepted.hiddenEvents || state.disposals > accepted.disposals))
  accepted.disposals = state.disposals
  accepted.hiddenEvents = state.hiddenEvents
  checkInvariants()
}

const cleanup = async () => {
  if (containerId !== homeContainerId) {
    await moveTo(homeContainerId)
  }
  await hideView()
}

const register = (context, name, label, callback) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(`webview-view-visibility-churn.${name}`, async () => {
      try {
        await callback()
        void vscode.window.showInformationMessage(`${prefix}: ${label} (${describe()})`)
      } catch (error) {
        void vscode.window.showErrorMessage(`${prefix}: ${label} failed: ${error && error.message ? error.message : error}`)
      }
    }),
  )
}

exports.activate = (context) => {
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(viewId, provider))
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('webviewViewVisibilityChurnDock.placeholder', {
      getChildren: () => [],
      getTreeItem: (element) => element,
    }),
  )
  register(context, 'setup', 'setup complete', setup)
  register(context, 'expectReady', 'ready', expectReady)
  register(context, 'expectHidden', 'hidden', expectHidden)
  register(context, 'moveToPanel', 'moved to panel', () => moveTo(panelContainerId))
  register(context, 'moveBack', 'moved back', () => moveTo(homeContainerId))
  register(context, 'cleanup', 'cleanup complete', cleanup)
}
