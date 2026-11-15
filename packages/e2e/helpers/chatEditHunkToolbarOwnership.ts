import type { TestContext } from '../types.ts'

// This probe supports unbundled development builds. Keep only weak references:
// the assertions must not themselves keep a pooled widget or its menu alive.
export const installOwnershipProbe = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.evaluate({
    expression: `(async () => {
      if (globalThis.__hunkToolbarProbe) throw new Error('Hunk toolbar probe already installed')
      const { MenuWorkbenchToolBar } = await import(new URL('vs/platform/actions/browser/toolbar.js', globalThis._VSCODE_FILE_ROOT).href)
      const prototype = MenuWorkbenchToolBar.prototype
      const original = prototype._updateToolbar
      if (typeof original !== 'function') throw new Error('Requires an unbundled development build with menu toolbars')
      const seen = new WeakSet()
      const widgets = new WeakSet()
      const probe = globalThis.__hunkToolbarProbe = { records: [], started: 0, completed: 0, release: undefined, arm: false, reused: 0 }
      prototype._updateToolbar = function (...args) {
        if (this._container?.classList.contains('chat-diff-change-content-widget') && !seen.has(this)) {
          seen.add(this)
          const widget = this._menuOptions?.arg
          if (!widget || !this._menu?._disposables || !this._menu?._onDidChange) throw new Error('Unsupported hunk menu ownership shape')
          if (widgets.has(widget)) probe.reused++
          widgets.add(widget)
          probe.records.push({ toolbar: new WeakRef(this), menu: new WeakRef(this._menu), widget: new WeakRef(widget) })
          const runner = this.actionRunner
          const runAction = runner.runAction
          runner.runAction = async function (action, context) {
            if (probe.arm && action.id === 'chatEditor.action.acceptHunk') {
              probe.arm = false
              probe.started++
              await new Promise(resolve => { probe.release = resolve })
              probe.release = undefined
            }
            return runAction.call(this, action, context)
          }
          this._store.add(runner.onDidRun(event => {
            if (event.action.id === 'chatEditor.action.acceptHunk') {
              if (event.error) throw event.error
              probe.completed++
            }
          }))
        }
        return original.apply(this, args)
      }
      probe.restore = () => {
        probe.release?.()
        prototype._updateToolbar = original
        delete globalThis.__hunkToolbarProbe
      }
    })()`,
    awaitPromise: true,
  })
}

export const waitForOwnership = async (
  { Workbench }: TestContext,
  liveMenus: number,
  minimumCreated: number,
  pending = false,
): Promise<void> => {
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      let last
      const check = () => {
        const probe = globalThis.__hunkToolbarProbe
        let live = 0
        let invalid = 0
        let hiddenRunning = 0
        for (const record of probe.records) {
          const toolbar = record.toolbar.deref()
          const menu = record.menu.deref()
          const widget = record.widget.deref()
          if (menu && !menu._disposables.isDisposed) {
            if (widget && !widget._toolbarVisible && widget._runningActions === 1 && !widget._hideToolbarScheduler.isScheduled()) hiddenRunning++
            live++
            if (!toolbar || toolbar._store.isDisposed || !menu._onDidChange.hasListeners()) invalid++
          } else if (toolbar && !toolbar._store.isDisposed) {
            invalid++
          } else if (menu && menu._onDidChange.hasListeners()) {
            invalid++
          }
        }
        const pending = !!probe.release
        last = JSON.stringify({ created: probe.records.length, live, invalid, hiddenRunning, pending, started: probe.started, completed: probe.completed })
        if (probe.records.length >= ${minimumCreated} && live === ${liveMenus} && invalid === 0 && pending === ${pending} && (!pending || hiddenRunning === 1)) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Hunk menu ownership mismatch: ' + last))
        setTimeout(check, 50)
      }
      check()
    })`,
    awaitPromise: true,
  })
}

export const restoreOwnershipProbe = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.evaluate({ expression: 'globalThis.__hunkToolbarProbe?.restore()' })
}

export const command = async ({ Notification, QuickPick }: TestContext, name: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand(`Chat Edit Hunk Toolbar Lifecycle: ${name}`)
  await Notification.shouldHaveItem(`Chat Edit Hunk Toolbar Lifecycle: ${name.toLowerCase()} complete`)
  await Notification.closeAll({ force: true })
}

export const waitForHunks = async ({ Workbench }: TestContext, hunks: number, toolbars: number): Promise<void> => {
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        const widgets = document.querySelectorAll('.part.editor .chat-diff-change-content-widget')
        const menus = document.querySelectorAll('.part.editor .chat-diff-change-content-widget .monaco-toolbar')
        if (widgets.length === ${hunks} && menus.length === ${toolbars}) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Expected ${hunks} hunk widgets and ${toolbars} toolbars; got ' + widgets.length + ' and ' + menus.length))
        setTimeout(check, 50)
      }
      check()
    })`,
    awaitPromise: true,
  })
}

export const clickHunkAction = async ({ Workbench }: TestContext, label: string): Promise<void> => {
  await Workbench.evaluate({
    expression: `(() => {
      const actions = Array.from(document.querySelectorAll('.part.editor .chat-diff-change-content-widget.hover .action-label'))
      const action = actions.find(node => node.getAttribute('aria-label')?.startsWith(${JSON.stringify(label)}))
      if (!action) throw new Error('Missing visible hunk action ${label}: ' + actions.map(node => node.getAttribute('aria-label')).join(', '))
      action.click()
    })()`,
  })
}

export const beginIteration = async (context: TestContext): Promise<void> => {
  await waitForOwnership(context, 0, 0)
  await context.Workbench.evaluate({
    expression: `(() => {
      const probe = globalThis.__hunkToolbarProbe
      probe.records = []
      probe.started = 0
      probe.completed = 0
      probe.reused = 0
    })()`,
  })
}
