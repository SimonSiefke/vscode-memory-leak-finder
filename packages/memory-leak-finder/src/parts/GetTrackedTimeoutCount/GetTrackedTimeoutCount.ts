import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { VError } from '../VError/VError.ts'

export const getTrackedTimeoutCount = async (session: Session): Promise<number> => {
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (typeof globalThis.getTrackedTimeoutCount === 'function') {
          return globalThis.getTrackedTimeoutCount()
        }
        return -1
      })()`,
      returnByValue: true,
    })
    if (typeof result !== 'number' || result < 0) {
      throw new Error('Tracked timeout instrumentation is not available')
    }
    return result
  } catch (error) {
    throw new VError(error, 'Failed to get tracked timeout count')
  }
}
