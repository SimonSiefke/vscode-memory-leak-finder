import { expect, test } from '@jest/globals'
import * as CreateBunWebkitRpc from '../src/parts/CreateBunWebkitRpc/CreateBunWebkitRpc.ts'

const createFakeRpc = (responses: any[]) => {
  const invocations: { method: string; params: any }[] = []
  return {
    callbacks: {},
    connectionClosed: () => false,
    dispose() {},
    invocations,
    invoke(method: string, params: any) {
      invocations.push({ method, params })
      const response = responses.shift()
      if (!response) {
        throw new Error(`Unexpected invocation ${method}`)
      }
      return Promise.resolve(response)
    },
    invokeWithSession(sessionId: string, method: string, params: any) {
      invocations.push({ method: `${sessionId}:${method}`, params })
      const response = responses.shift()
      if (!response) {
        throw new Error(`Unexpected invocation ${method}`)
      }
      return Promise.resolve(response)
    },
    listeners: {},
    objectType: 'rpc',
    off() {},
    on() {},
    once() {
      return Promise.resolve(undefined)
    },
    onceListeners: {},
  }
}

test('createBunWebkitRpc - initializes inspector domains', async () => {
  const rpc = createFakeRpc([{ result: {} }, { result: {} }, { result: {} }, { result: {} }])

  await CreateBunWebkitRpc.createBunWebkitRpc(rpc)

  expect(rpc.invocations).toEqual([
    { method: 'Inspector.enable', params: {} },
    { method: 'Runtime.enable', params: {} },
    { method: 'Console.enable', params: {} },
    { method: 'Inspector.initialized', params: {} },
  ])
})

test('createBunWebkitRpc - runtime enable is a no-op after initialization', async () => {
  const rpc = createFakeRpc([{ result: {} }, { result: {} }, { result: {} }, { result: {} }])

  const bunRpc = await CreateBunWebkitRpc.createBunWebkitRpc(rpc)
  const result = await bunRpc.invoke('Runtime.enable', {})

  expect(result).toEqual({ result: {} })
  expect(rpc.invocations).toEqual([
    { method: 'Inspector.enable', params: {} },
    { method: 'Runtime.enable', params: {} },
    { method: 'Console.enable', params: {} },
    { method: 'Inspector.initialized', params: {} },
  ])
})

test('createBunWebkitRpc - translates runtime queryObjects to queryInstances', async () => {
  const rpc = createFakeRpc([
    { result: {} },
    { result: {} },
    { result: {} },
    { result: {} },
    {
      result: {
        result: {
          type: 'string',
          value: 'Object',
        },
        wasThrown: false,
      },
    },
    {
      result: {
        result: {
          className: 'Array',
          description: 'Array',
          objectId: 'bun-array-1',
          subtype: 'array',
          type: 'object',
        },
        wasThrown: false,
      },
    },
  ])

  const bunRpc = await CreateBunWebkitRpc.createBunWebkitRpc(rpc)
  const result = await bunRpc.invoke('Runtime.queryObjects', {
    objectGroup: 'group-1',
    prototypeObjectId: 'prototype-1',
  })

  expect(result).toEqual({
    result: {
      objects: {
        className: 'Array',
        description: 'Array',
        objectId: 'bun-array-1',
        subtype: 'array',
        type: 'object',
      },
    },
  })
  expect(rpc.invocations).toEqual([
    { method: 'Inspector.enable', params: {} },
    { method: 'Runtime.enable', params: {} },
    { method: 'Console.enable', params: {} },
    { method: 'Inspector.initialized', params: {} },
    {
      method: 'Runtime.callFunctionOn',
      params: {
        functionDeclaration: 'function(){ return this && this.constructor ? this.constructor.name : "" }',
        objectId: 'prototype-1',
        returnByValue: true,
      },
    },
    {
      method: 'Runtime.evaluate',
      params: {
        doNotPauseOnExceptionsAndMuteConsole: true,
        expression: 'queryInstances(globalThis["Object"])',
        includeCommandLineAPI: true,
        objectGroup: 'group-1',
        returnByValue: false,
      },
    },
  ])
})