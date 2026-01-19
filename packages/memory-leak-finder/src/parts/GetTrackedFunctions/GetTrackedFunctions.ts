import type { Session } from '../Session/Session.ts'
import { DevtoolsProtocolRuntime } from '../DevtoolsProtocol/DevtoolsProtocol.ts'
import { VError } from '../VError/VError.ts'

export const getTrackedFunctions = async (session: Session): Promise<Record<string, number>> => {
  try {
    const result = await DevtoolsProtocolRuntime.evaluate(session, {
      expression: `(() => {
        if (!globalThis.___functionStatistics) {
          return {}
        }
        const stats = {}
        for (const [name, count] of globalThis.___functionStatistics) {
          stats[name] = count
        }
        return stats
      })()`,
      returnByValue: true,
    })

    if (typeof result !== 'object' || result === null) {
      return {}
    }

    return result as Record<string, number>
  } catch (error) {
    throw new VError(error, `Failed to get tracked functions`)
  }
}
