import { createContext, runInNewContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import { install } from '../src/parts/LongAnimationFramesTracker/LongAnimationFramesTracker.ts'
import * as Measure from '../src/parts/MeasureLongAnimationFrames/MeasureLongAnimationFrames.ts'

const createRealm = (supportedEntryTypes = ['long-animation-frame']) => {
  const observers: any[] = []
  let now = 100
  class PerformanceObserver {
    static supportedEntryTypes = supportedEntryTypes
    callback: (list: any) => void
    options: any
    pending: any[] = []
    disconnected = false
    constructor(callback: (list: any) => void) {
      this.callback = callback
      observers.push(this)
    }
    observe(options: any) {
      this.options = options
    }
    takeRecords() {
      return this.pending.splice(0)
    }
    disconnect() {
      this.disconnected = true
    }
    deliver(entries: any[]) {
      this.callback({ getEntries: () => entries })
    }
  }
  const realm = {
    PerformanceObserver,
    performance: { now: () => now },
    requestAnimationFrame: (callback: () => void) => setTimeout(callback, 0),
    setTimeout,
    clearTimeout,
  }
  return { observers, realm, setNow: (value: number) => (now = value) }
}

const script = (overrides: any = {}) => ({
  duration: 30,
  forcedStyleAndLayoutDuration: 4,
  sourceURL: 'vscode-file://vscode-app/out/vs/workbench/workbench.desktop.main.js',
  sourceFunctionName: 'layout',
  sourceCharPosition: 1234,
  invoker: 'DOMWindow.onresize',
  invokerType: 'event-listener',
  ...overrides,
})

const frame = (startTime: number, overrides: any = {}) => ({
  startTime,
  duration: 80,
  blockingDuration: 30,
  renderStart: startTime + 70,
  scripts: [],
  ...overrides,
})

test('observes new frames only and aggregates scripts by source and invoker', () => {
  const { observers, realm } = createRealm()
  const tracker = runInNewContext(`(${install.toString()})()`, realm)
  const [observer] = observers
  expect(observer.options).toEqual({ type: 'long-animation-frame', buffered: false })
  observer.deliver([
    frame(50, { scripts: [script({ duration: 500 })] }),
    frame(200, { scripts: [script(), script({ sourceURL: '', invoker: 'TimerHandler:setTimeout', duration: 20 })] }),
    frame(300, {
      duration: 120,
      blockingDuration: 70,
      renderStart: 0,
      scripts: [script({ duration: 50, forcedStyleAndLayoutDuration: 6 })],
    }),
  ])
  observer.pending.push(frame(400, { scripts: [script({ sourceURL: '', invoker: 'FrameRequestCallback', duration: 10 })] }))
  const snapshot = tracker.snapshot()
  expect(snapshot.available).toBe(true)
  expect(snapshot.incomplete).toBe(false)
  expect(snapshot.metrics).toMatchObject({
    frameCount: 3,
    totalDurationMs: 280,
    maxDurationMs: 120,
    totalBlockingDurationMs: 130,
    totalRenderDurationMs: 20,
    totalForcedStyleAndLayoutDurationMs: 18,
    scriptCount: 4,
    totalScriptDurationMs: 110,
    ignoredBeforeStartCount: 1,
  })
  expect(snapshot.rows).toHaveLength(2)
  expect(snapshot.rows[0]).toMatchObject({
    sourceURL: 'vscode-file://vscode-app/out/vs/workbench/workbench.desktop.main.js',
    sourceFunctionName: 'layout',
    sourceCharPosition: 1234,
    invoker: 'DOMWindow.onresize',
    count: 2,
    durationMs: 80,
    maxDurationMs: 50,
    forcedStyleAndLayoutDurationMs: 10,
  })
  expect(snapshot.rows[1]).toMatchObject({ name: 'unattributed (includes harness-evaluated code)', count: 2, durationMs: 30 })
  tracker.dispose()
  expect(observer.disconnected).toBe(true)
  observer.deliver([frame(500)])
  expect(tracker.snapshot().metrics.frameCount).toBe(3)
})

test('caps retained frames and marks the capture incomplete', () => {
  const { observers, realm } = createRealm()
  const tracker = runInNewContext(`(${install.toString()})()`, realm)
  observers[0].deliver(Array.from({ length: 2003 }, (_, index) => frame(200 + index)))
  const snapshot = tracker.snapshot()
  expect(snapshot.metrics).toMatchObject({ frameCount: 2000, overflowFrameCount: 3 })
  expect(snapshot.incomplete).toBe(true)
  tracker.dispose()
})

test('missing long animation frame support is unavailable', () => {
  const unsupported = runInNewContext(`(${install.toString()})()`, createRealm(['longtask']).realm)
  expect(unsupported.snapshot()).toMatchObject({ available: false, reason: expect.stringContaining('unavailable') })
  unsupported.dispose()
  expect(runInNewContext(`(${install.toString()})()`, {}).snapshot().available).toBe(false)
})

test('stop flushes pending frames before the snapshot and cleans up', async () => {
  const { observers, realm } = createRealm()
  const context = createContext(realm)
  const session = {
    invoke: async (_method: string, options: any) => {
      const value = await runInNewContext(options.expression, context)
      return { result: { result: { value } } }
    },
    dispose() {},
  } as any
  expect(await Measure.start(session)).toMatchObject({ available: true })
  const [observer] = observers
  realm.requestAnimationFrame = (callback: () => void) =>
    setTimeout(() => {
      observer.pending.push(frame(300, { scripts: [script()] }))
      callback()
    }, 0)
  const result = await Measure.stop(session)
  expect(result.metrics.frameCount).toBe(2)
  expect(observer.disconnected).toBe(true)
  expect(await Measure.stop(session)).toMatchObject({ available: false })
  expect(Measure.summary(result)).toContain('frameCount | 2')
})
