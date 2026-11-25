import { expect, test } from '@jest/globals'
import type { Session } from '../src/parts/Session/Session.ts'
import * as GetMeasure from '../src/parts/GetMeasure/GetMeasure.ts'
import * as Measure from '../src/parts/MeasureIdleCpuAfterScenario/MeasureIdleCpuAfterScenario.ts'
import * as Measures from '../src/parts/Measures/Measures.ts'

type ProcessInfo = { type: string; id: number; cpuTime: number }

const createSession = (responses: unknown[]): { session: Session; methods: string[] } => {
  const methods: string[] = []
  const session = {
    dispose() {},
    invoke: async () => {
      throw new Error('page session must not be used')
    },
    invokeBrowser: async (method: string) => {
      methods.push(method)
      if (responses.length === 0) throw new Error('unexpected request')
      return responses.shift()
    },
  } as unknown as Session
  return { methods, session }
}

const info = (...processInfo: ProcessInfo[]) => ({ id: 1, result: { processInfo } })

const noDelay = async () => {}

let clock = 0
const now = () => (clock += 1500)
const createState = (session: Session) => Measure.createState(session, { delay: noDelay, now })

test('public measure resolves', () => {
  expect(GetMeasure.getMeasure({ Measures }, 'idle-cpu-after-scenario')).toBe(Measure)
})

test('reports idle CPU per process and per type from the browser connection', async () => {
  const { methods, session } = createSession([
    info({ cpuTime: 1, id: 10, type: 'browser' }, { cpuTime: 2, id: 20, type: 'utility' }, { cpuTime: 0.5, id: 30, type: 'renderer' }),
    info(
      { cpuTime: 1.02, id: 10, type: 'browser' },
      { cpuTime: 2.01, id: 20, type: 'utility' },
      { cpuTime: 0.5, id: 30, type: 'renderer' },
    ),
    info({ cpuTime: 3, id: 10, type: 'browser' }, { cpuTime: 4, id: 20, type: 'utility' }, { cpuTime: 0.6, id: 30, type: 'renderer' }),
    info(
      { cpuTime: 3.03, id: 10, type: 'browser' },
      { cpuTime: 4.33, id: 20, type: 'utility' },
      { cpuTime: 0.6, id: 30, type: 'renderer' },
    ),
  ])
  const state = createState(session)
  const before = await Measure.start(state)
  const after = await Measure.stop(state)
  const result = Measure.compare(before, after)
  expect(methods).toEqual(Array(4).fill('SystemInfo.getProcessInfo'))
  expect(result).toMatchObject({ supported: true, idleCpuBeforeMs: 30, idleCpuAfterMs: 360, deltaMs: 330, windowMs: 3000 })
  expect(result.processes).toEqual([
    { type: 'utility', id: 20, idleCpuBeforeMs: 10, idleCpuAfterMs: 330, deltaMs: 320 },
    { type: 'browser', id: 10, idleCpuBeforeMs: 20, idleCpuAfterMs: 30, deltaMs: 10 },
    { type: 'renderer', id: 30, idleCpuBeforeMs: 0, idleCpuAfterMs: 0, deltaMs: 0 },
  ])
  expect(result.types[0]).toEqual({ type: 'utility', processCount: 1, idleCpuBeforeMs: 10, idleCpuAfterMs: 330, deltaMs: 320 })
  expect(Measure.isLeak()).toBe(false)
  expect(Measure.summary(result)).toContain('(+330 ms)')
})

test('only compares processes present in all four samples with monotonic CPU time', async () => {
  const { session } = createSession([
    info({ cpuTime: 1, id: 10, type: 'browser' }, { cpuTime: 5, id: 40, type: 'renderer' }),
    info({ cpuTime: 1, id: 10, type: 'browser' }, { cpuTime: 5, id: 40, type: 'renderer' }),
    info({ cpuTime: 1, id: 10, type: 'browser' }, { cpuTime: 0.1, id: 40, type: 'renderer' }, { cpuTime: 0, id: 50, type: 'utility' }),
    info({ cpuTime: 1.1, id: 10, type: 'browser' }, { cpuTime: 0.2, id: 40, type: 'renderer' }, { cpuTime: 1, id: 50, type: 'utility' }),
  ])
  const state = createState(session)
  const result = Measure.compare(await Measure.start(state), await Measure.stop(state))
  expect(result.processes.map((row) => row.id)).toEqual([10])
  expect(result.unmatchedProcesses).toEqual(
    expect.arrayContaining([
      { type: 'renderer', id: 40 },
      { type: 'utility', id: 50 },
    ]),
  )
  expect(result.deltaMs).toBe(100)
})

test('error responses and sessions without a browser connection are unsupported', async () => {
  const { session } = createSession([
    { id: 1, error: { code: -32000, message: 'SystemInfo.getProcessInfo is only supported on the browser target' } },
  ])
  const before = await Measure.start(createState(session))
  const result = Measure.compare(before, { supported: false, reason: 'not reached' })
  expect(result).toMatchObject({ supported: false, isLeak: false, processes: [] })
  expect(result.unsupportedReason).toContain('only supported on the browser target')
  expect(Measure.summary(result)).toContain('unavailable')

  const nodeState = createState({ dispose() {}, invoke: async () => ({}) } as unknown as Session)
  const nodeResult = Measure.compare(await Measure.start(nodeState), await Measure.stop(nodeState))
  expect(nodeResult.unsupportedReason).toContain('root Chromium browser connection')
})

test('unexpected response shapes are unsupported instead of throwing', async () => {
  const { session } = createSession([{ id: 1, result: { processInfo: [{ type: 'browser', id: 1 }] } }])
  const result = await Measure.start(createState(session))
  expect(result).toEqual({ supported: false, reason: 'SystemInfo.getProcessInfo returned an unexpected response' })
})

test('releasing resources aborts a pending idle window', async () => {
  const { methods, session } = createSession([info({ cpuTime: 1, id: 10, type: 'browser' })])
  const state = Measure.createState(session, { now, windowMs: 60_000 })
  const pending = Measure.stop(state)
  await new Promise((resolve) => setImmediate(resolve))
  Measure.releaseResources(state)
  await expect(pending).resolves.toEqual({ supported: false, reason: 'The idle window was cancelled before completion' })
  await expect(Measure.start(state)).resolves.toMatchObject({ supported: false })
  expect(methods).toHaveLength(1)
})
