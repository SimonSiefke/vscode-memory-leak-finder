import { DevtoolsProtocolRuntime } from '../src/parts/DevtoolsProtocol/DevtoolsProtocol.js'
import { jest } from '@jest/globals'

test('evaluate - error - failed to parse url', async () => {
  const rpc = {
    invoke: jest.fn(() => {
      return {
        id: 8,
        result: {
          result: { type: 'object', value: {} },
          exceptionDetails: {
            exceptionId: 1,
            text: 'Uncaught',
            lineNumber: 1,
            columnNumber: 24,
            scriptId: '7',
            stackTrace: { callFrames: [{ functionName: '', scriptId: '7', url: '', lineNumber: 0, columnNumber: 23 }] },
            exception: {
              type: 'object',
              subtype: 'error',
              className: 'TypeError',
              description:
                "TypeError: Failed to execute 'fetch' on 'Window': Failed to parse URL from ./data.json\n    at <anonymous>:1:24",
              objectId: '-1600148423452573628.1.1',
            },
          },
        },
        sessionId: 'C04DDD32C534C5DD93B8A2DAB5B37513',
      }
    }),
  }
  await expect(
    DevtoolsProtocolRuntime.evaluate(rpc, {
      expression: `fetch('./data.json')`,
    }),
  ).rejects.toThrowError(new Error(`TypeError: Failed to execute 'fetch' on 'Window': Failed to parse URL from ./data.json`))
})
