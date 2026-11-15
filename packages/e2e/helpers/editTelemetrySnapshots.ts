import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

let settingsPath = ''
let originalSettings: string | undefined

export const install = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  const userData = await Electron.evaluate('globalThis._____electron.app.getPath("userData")')
  assert.equal(typeof userData, 'string')
  settingsPath = join(userData as string, 'User', 'settings.json')
  originalSettings = await readFile(settingsPath, 'utf8')
  await Workbench.evaluate({
    expression: `(async () => {
      if (globalThis.__editSnapshotProbe) throw new Error('Snapshot probe already installed')
      const load = path => import(new URL('vs/' + path + '.js', globalThis._VSCODE_FILE_ROOT).href)
      const { DocumentWithSourceAnnotatedEdits, CombineStreamedChanges } = await load('workbench/contrib/editTelemetry/browser/helpers/documentWithAnnotatedEdits')
      const { observableValue } = await load('base/common/observable')
      const { CommandsRegistry } = await load('platform/commands/common/commands')
      const prototype = Object.getPrototypeOf(observableValue('snapshot probe', undefined))
      const original = prototype.set
      if (typeof original !== 'function') throw new Error('Requires unbundled development build with observable edit telemetry')
      const seen = new WeakSet()
      const probe = globalThis.__editSnapshotProbe = { snapshots: [], observed: 0, published: 0, document: undefined, current: undefined, lastPublished: undefined }
      prototype.set = function (value, ...args) {
        const owner = this._debugNameData?.owner
        if (owner instanceof DocumentWithSourceAnnotatedEdits && owner._originalDoc.uri.path.endsWith('/snapshot-editing.txt')) {
          probe.document = new WeakRef(owner._originalDoc)
          const previous = this.get()
          if (!seen.has(previous)) {
            seen.add(previous)
            probe.snapshots.push(new WeakRef(previous))
          }
          probe.observed++
          probe.current = new WeakRef(value)
        }
        if (owner instanceof CombineStreamedChanges && owner._originalDoc._originalDoc?.uri.path.endsWith('/snapshot-editing.txt')) {
          probe.published++
          probe.lastPublished = new WeakRef(value)
        }
        return original.call(this, value, ...args)
      }
      probe.ready = () => !!CommandsRegistry.getCommand('editTelemetry.toggleDebugDecorations')
      probe.restore = () => { prototype.set = original; delete globalThis.__editSnapshotProbe }
    })()`,
    awaitPromise: true,
  })
  const settings = JSON.parse(originalSettings)
  // Telemetry level must be active before toggling edit statistics: the
  // contribution observes the edit-stats setting, not changes to the level.
  await writeFile(settingsPath, JSON.stringify({ ...settings, 'telemetry.telemetryLevel': 'all', 'telemetry.editStats.enabled': false }))
  const disableDeadline = Date.now() + 10000
  while (await Workbench.evaluate({ expression: 'globalThis.__editSnapshotProbe.ready()' })) {
    assert.ok(Date.now() < disableDeadline, 'Edit telemetry did not deactivate before setup')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  await new Promise((resolve) => setTimeout(resolve, 1000))
  await writeFile(
    settingsPath,
    JSON.stringify({
      ...settings,
      'telemetry.telemetryLevel': 'all',
      'telemetry.editStats.enabled': true,
      'telemetry.editStats.showStatusBar': true,
    }),
  )
  const deadline = Date.now() + 10000
  while (!(await Workbench.evaluate({ expression: 'globalThis.__editSnapshotProbe.ready()' }))) {
    assert.ok(Date.now() < deadline, 'Edit telemetry tracking is inactive; requires usage telemetry in a development build')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

export const observed = async ({ Workbench }: TestContext): Promise<number> =>
  (await Workbench.evaluate({ expression: 'globalThis.__editSnapshotProbe.observed' })) as number

export const waitForConsumption = async ({ Workbench }: TestContext, minimum = 1): Promise<void> => {
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 10000
      const check = () => {
        const p = globalThis.__editSnapshotProbe
        if (!p?.ready()) return reject(new Error('Edit telemetry tracking became inactive'))
        if (p.observed >= ${minimum} && p.published === p.observed && p.current?.deref() === p.lastPublished?.deref()) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Annotation consumption did not catch up: ' + p.published + '/' + p.observed))
        setTimeout(check, 20)
      }
      check()
    })`,
    awaitPromise: true,
  })
}

export const assertCollected = async (context: TestContext): Promise<void> => {
  await waitForConsumption(context)
  // No dereferencing immediately before GC: WeakRef keeps targets alive until
  // the end of that job. Never call waitForQueue, which restarts the iterator
  // and would release the affected replay buffer before we could measure it.
  await context.Workbench.collectGarbage()
  await context.Workbench.collectGarbage()
  await context.Workbench.evaluate({
    expression: `(() => {
      const p = globalThis.__editSnapshotProbe
      const doc = p.document?.deref()
      if (!document.querySelector('.tab.active[data-resource-name="snapshot-editing.txt"]')) throw new Error('Measured editor must remain open and active')
      if (!doc || doc.value.get() !== p.current?.deref()) throw new Error('Measured document must remain open and current')
      if (p.snapshots.length < 12) throw new Error('Too few distinct document snapshots: ' + p.snapshots.length)
      // The consumer can legitimately keep its most recent loop value while
      // waiting for the next edit. Measure only older, consumed snapshots.
      const old = p.snapshots.slice(0, -2)
      const retained = old.filter(ref => ref.deref() !== undefined).length
      if (retained) throw new Error('Consumed edit telemetry snapshots retained: ' + retained + '/' + old.length)
      p.snapshots = p.snapshots.slice(-2)
    })()`,
  })
}

export const restore = async ({ Workbench }: TestContext): Promise<void> => {
  try {
    await Workbench.evaluate({ expression: 'globalThis.__editSnapshotProbe?.restore()' })
  } finally {
    if (originalSettings !== undefined) {
      await writeFile(settingsPath, originalSettings)
      originalSettings = undefined
    }
  }
}
