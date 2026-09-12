import { expect, test } from '@jest/globals'
import * as DevtoolsProtocolTracing from '../src/parts/DevtoolsProtocolTracing/DevtoolsProtocolTracing.js'

const createSession = () => {
  const calls = []
  const session = {
    async invoke(method, params) {
      calls.push([method, params])
      if (method === 'Tracing.requestMemoryDump') {
        return {
          result: {
            dumpGuid: '0x1',
            success: true,
          },
        }
      }
      return { result: {} }
    },
  }
  return { calls, session }
}

test('requestMemoryDump invokes Tracing.requestMemoryDump with the exact parameters', async () => {
  const { calls, session } = createSession()
  const options = {
    deterministic: true,
    levelOfDetail: 'detailed',
  }

  const result = await DevtoolsProtocolTracing.requestMemoryDump(session, options)

  expect(result).toEqual({ dumpGuid: '0x1', success: true })
  expect(calls).toEqual([['Tracing.requestMemoryDump', options]])
})
