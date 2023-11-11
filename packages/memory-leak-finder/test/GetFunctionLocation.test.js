import * as GetFunctionLocation from '../src/parts/GetFunctionLocation/GetFunctionLocation.js'

test('getFunctionLocation', async () => {
  const session = {
    invoke() {
      return {
        result: {
          result: {
            internalProperties: [
              {
                name: '[[FunctionLocation]]',
                value: {
                  type: 'object',
                  subtype: 'internal#location',
                  value: { scriptId: '16', lineNumber: 1552, columnNumber: 2776 },
                  description: 'Object',
                },
              },
            ],
          },
        },
      }
    },
  }
  const objectId = 'test-123'
  expect(await GetFunctionLocation.getFunctionLocation(session, objectId)).toEqual({ scriptId: '16', lineNumber: 1552, columnNumber: 2776 })
})
