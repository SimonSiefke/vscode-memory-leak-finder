import { expect, test } from '@jest/globals'
import * as CreateBunWebkitRpc from '../src/parts/CreateBunWebkitRpc/CreateBunWebkitRpc.ts'
import * as GetClassCount from '../src/parts/GetClassCount/GetClassCount.ts'

const createFakeNodeRpc = () => {
  const invocations: { method: string; params: any }[] = []
  return {
    callbacks: {},
    connectionClosed: () => false,
    dispose() {},
    invocations,
    listeners: {},
    objectType: 'rpc',
    off() {},
    on() {},
    once() {
      return Promise.resolve(undefined)
    },
    onceListeners: {},
    invoke(method: string, params: any) {
      invocations.push({ method, params })
      switch (method) {
        case 'Inspector.enable':
        case 'Runtime.enable':
        case 'Console.enable':
        case 'Inspector.initialized': {
          return Promise.resolve({ result: {} })
        }
        case 'Runtime.callFunctionOn': {
          return Promise.resolve({
            result: {
              result: {
                type: 'string',
                value: 'Object',
              },
              wasThrown: false,
            },
          })
        }
        case 'Runtime.evaluate': {
          if (params.expression === 'Object.prototype') {
            return Promise.resolve({
              result: {
                result: {
                  className: 'Object',
                  description: 'Object',
                  objectId: 'prototype-1',
                  type: 'object',
                },
              },
            })
          }
          const CustomThing = class CustomThing {}
          const customThing = new CustomThing()
          const objectInstances = [customThing, {}, [], new Map()]
          const queryInstances = (constructor: any) => {
            if (constructor === Object) {
              return objectInstances
            }
            if (constructor === Function) {
              return [Object, Array, Function, Map, Set, CustomThing]
            }
            if (constructor === CustomThing) {
              return [customThing]
            }
            return []
          }
          const result = new Function('queryInstances', `return (${params.expression})`)(queryInstances)
          return Promise.resolve({
            result: {
              result: {
                type: 'number',
                value: result,
              },
            },
          })
        }
        default: {
          throw new Error(`Unexpected invocation ${method}`)
        }
      }
    },
    invokeWithSession(sessionId: string, method: string, params: any) {
      invocations.push({ method: `${sessionId}:${method}`, params })
      throw new Error(`Unexpected invocation ${method}`)
    },
  }
}

test('getClassCount works in node without browser globals', async () => {
  const rpc = createFakeNodeRpc()
  const bunRpc = await CreateBunWebkitRpc.createBunWebkitRpc(rpc)

  const result = await GetClassCount.getClassCount(bunRpc as any, 'group-1')

  expect(result).toBe(1)
  expect(rpc.invocations.slice(0, 6)).toEqual([
    { method: 'Inspector.enable', params: {} },
    { method: 'Runtime.enable', params: {} },
    { method: 'Console.enable', params: {} },
    { method: 'Inspector.initialized', params: {} },
    {
      method: 'Runtime.evaluate',
      params: {
        expression: 'Object.prototype',
        objectGroup: 'group-1',
        returnByValue: false,
      },
    },
    {
      method: 'Runtime.callFunctionOn',
      params: {
        functionDeclaration: 'function(){ return this && this.constructor ? this.constructor.name : "" }',
        objectId: 'prototype-1',
        returnByValue: true,
      },
    },
  ])
  expect(rpc.invocations).toHaveLength(7)
  expect(rpc.invocations[6]).toEqual({
    method: 'Runtime.evaluate',
    params: {
      awaitPromise: undefined,
      doNotPauseOnExceptionsAndMuteConsole: true,
      expression: expect.stringContaining('globalThis.Node'),
      includeCommandLineAPI: true,
      objectGroup: 'group-1',
      returnByValue: true,
    },
  })
  expect(rpc.invocations[6].params.expression).toContain('].filter(Boolean)')
  expect(rpc.invocations[6].params.expression).toContain('queryInstances(globalThis["Object"])')
})
