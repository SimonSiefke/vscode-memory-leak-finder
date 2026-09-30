import { expect, test } from '@jest/globals'
import { runInNewContext, createContext } from 'node:vm'
import * as Diagnostic from '../src/parts/RuntimePerformanceDiagnostic/RuntimePerformanceDiagnostic.ts'
test('installs once, snapshots, cleans up, and reports a lost context', async () => {
  const context = createContext({})
  const session = {
    invoke: async (_method: string, options: any) => {
      const value = await runInNewContext(options.expression, context)
      return { result: { result: { value } } }
    },
    dispose() {},
  } as any
  const install = () => ({ snapshot: () => ({ metrics: { count: 4 } }), dispose() {} })
  await Diagnostic.start(session, 'testTracker', install)
  await expect(Diagnostic.start(session, 'testTracker', install)).rejects.toThrow('already active')
  expect(await Diagnostic.stop(session, 'testTracker')).toMatchObject({ metrics: { count: 4 } })
  expect(await Diagnostic.stop(session, 'testTracker')).toMatchObject({ available: false })
  await Diagnostic.release(session, 'testTracker')
  expect(Diagnostic.compare({}, { metrics: {} }).isLeak).toBe(false)
})
