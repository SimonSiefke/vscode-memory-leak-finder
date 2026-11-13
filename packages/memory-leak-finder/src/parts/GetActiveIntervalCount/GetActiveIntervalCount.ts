import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getActiveIntervalCount = async (session: Session): Promise<number> => {
  const count = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(() => {
  const getCounts = globalThis.___memoryLeakFinderGetActiveTimerCounts
  if (typeof getCounts !== 'function') {
    throw new Error('active-interval-count requires workbench timer instrumentation')
  }
  return getCounts().intervals
})()`,
    returnByValue: true,
  })
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Invalid active interval count')
  }
  return count
}
