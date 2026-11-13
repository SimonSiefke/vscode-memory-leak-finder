import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'

export const getActiveTimeoutCount = async (session: Session): Promise<number> => {
  const count = await DevtoolsProtocolRuntime.evaluate(session, {
    expression: `(() => {
  const getCounts = globalThis.___memoryLeakFinderGetActiveTimerCounts
  if (typeof getCounts !== 'function') {
    throw new Error('active-timeout-count requires workbench timer instrumentation')
  }
  return getCounts().timeouts
})()`,
    returnByValue: true,
  })
  if (!Number.isInteger(count) || count < 0) {
    throw new Error('Invalid active timeout count')
  }
  return count
}
