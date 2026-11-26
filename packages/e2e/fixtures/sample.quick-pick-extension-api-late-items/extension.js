const vscode = require('vscode')

const prefix = 'Quick Pick Late Items'
const initialLabel = 'Initial item'
const loadingLabel = 'Loading results…'
const lateLabel = 'Late item'

let current
let liveQuickPicks = 0

const createDeferred = () => {
  let resolve
  const promise = new Promise((r) => {
    resolve = r
  })
  return { promise, resolve }
}

const waitForMacrotask = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

const disposeCurrent = async () => {
  const state = current
  if (!state) {
    return
  }
  current = undefined
  if (state.pending) {
    state.pending.resolve(false)
  }
  state.quickPick.dispose()
  for (const disposable of state.disposables) {
    disposable.dispose()
  }
  liveQuickPicks--
  if (state.load) {
    await state.load
  }
}

const open = async () => {
  await disposeCurrent()
  const quickPick = vscode.window.createQuickPick()
  liveQuickPicks++
  const state = {
    quickPick,
    disposables: [],
    hideCount: 0,
    pending: undefined,
    load: undefined,
    value: '',
  }
  current = state
  quickPick.title = prefix
  quickPick.placeholder = 'Type to start a deferred load'
  quickPick.items = [{ label: initialLabel }]
  state.disposables.push(
    quickPick.onDidHide(() => {
      state.hideCount++
    }),
  )
  state.disposables.push(
    quickPick.onDidChangeValue((value) => {
      state.value = value
      if (!value || state.pending) {
        return
      }
      // Barrier: the load stays pending until the Release command resolves it.
      const deferred = createDeferred()
      state.pending = deferred
      quickPick.busy = true
      quickPick.items = [{ label: loadingLabel, alwaysShow: true }]
      state.load = deferred.promise.then((released) => {
        if (!released) {
          return
        }
        // The user already pressed Escape, but the extension never called hide(),
        // so these late property updates are still sent to the renderer.
        quickPick.items = [{ label: lateLabel, description: state.value }]
        quickPick.busy = false
      })
    }),
  )
  quickPick.show()
}

const release = async () => {
  const state = current
  if (!state || !state.pending) {
    throw new Error('no pending load; open the quick pick and type a value first')
  }
  if (state.hideCount < 1) {
    throw new Error(`quick pick was not hidden before release (hide events: ${state.hideCount})`)
  }
  const hideCountBeforeRelease = state.hideCount
  state.pending.resolve(true)
  await state.load
  // Late item updates are batched behind a 0 ms timer before they are sent.
  await waitForMacrotask()
  // This round trip is ordered after the batched quick pick update on the same channel.
  await vscode.commands.executeCommand('setContext', 'quick-pick-extension-api-late-items.released', true)
  if (state.hideCount !== hideCountBeforeRelease) {
    throw new Error(`late items changed hide events from ${hideCountBeforeRelease} to ${state.hideCount}`)
  }
  return `value: ${state.value}, hide events: ${state.hideCount}`
}

const cleanup = async () => {
  await disposeCurrent()
  await vscode.commands.executeCommand('setContext', 'quick-pick-extension-api-late-items.released', false)
  return `live quick picks: ${liveQuickPicks}`
}

const register = (context, id, callback) => {
  context.subscriptions.push(
    vscode.commands.registerCommand(`quick-pick-extension-api-late-items.${id}`, async () => {
      try {
        await callback()
      } catch (error) {
        void vscode.window.showErrorMessage(`${prefix}: ${id} failed: ${error && error.message ? error.message : error}`)
      }
    }),
  )
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void disposeCurrent()
    },
  })
  register(context, 'open', open)
  register(context, 'release', async () => {
    const summary = await release()
    void vscode.window.showInformationMessage(`${prefix}: late items applied (${summary})`)
  })
  register(context, 'cleanup', async () => {
    const summary = await cleanup()
    void vscode.window.showInformationMessage(`${prefix}: cleanup complete (${summary})`)
  })
}
