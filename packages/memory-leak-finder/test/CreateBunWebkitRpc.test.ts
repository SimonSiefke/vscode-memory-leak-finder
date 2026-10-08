import { expect, test } from '@jest/globals'
import * as CreateBunWebkitRpc from '../src/parts/CreateBunWebkitRpc/CreateBunWebkitRpc.ts'

const createFakeRpc = () => {
  const invocations: { method: string; params: any }[] = []
  const responses = new Map<string, any[]>()
  return {
    callbacks: {},
    connectionClosed: () => false,
    dispose() {},
    invocations,
    enqueue(method: string, response: any) {
      const values = responses.get(method) || []
      values.push(response)
      responses.set(method, values)
    },
    invoke(method: string, params: any) {
      invocations.push({ method, params })
      const values = responses.get(method) || []
      const response = values.shift()
      responses.set(method, values)
      if (response === undefined) {
        throw new Error(`Unexpected invocation ${method}`)
      }
      return Promise.resolve(response)
    },
    invokeWithSession(sessionId: string, method: string, params: any) {
      invocations.push({ method: `${sessionId}:${method}`, params })
      const values = responses.get(method) || []
      const response = values.shift()
      responses.set(method, values)
      if (response === undefined) {
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
  const rpc = createFakeRpc()
  rpc.enqueue('Inspector.enable', { result: {} })
  rpc.enqueue('Runtime.enable', { result: {} })
  rpc.enqueue('Console.enable', { result: {} })
  rpc.enqueue('Inspector.initialized', { result: {} })

  await CreateBunWebkitRpc.createBunWebkitRpc(rpc)

  expect(rpc.invocations).toEqual([
    { method: 'Inspector.enable', params: {} },
    { method: 'Runtime.enable', params: {} },
    { method: 'Console.enable', params: {} },
    { method: 'Inspector.initialized', params: {} },
  ])
})

test('createBunWebkitRpc - runtime enable is a no-op after initialization', async () => {
  const rpc = createFakeRpc()
  rpc.enqueue('Inspector.enable', { result: {} })
  rpc.enqueue('Runtime.enable', { result: {} })
  rpc.enqueue('Console.enable', { result: {} })
  rpc.enqueue('Inspector.initialized', { result: {} })

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

test('createBunWebkitRpc - returns a synthetic object for runtime queryObjects', async () => {
  const rpc = createFakeRpc()
  rpc.enqueue('Inspector.enable', { result: {} })
  rpc.enqueue('Runtime.enable', { result: {} })
  rpc.enqueue('Console.enable', { result: {} })
  rpc.enqueue('Inspector.initialized', { result: {} })
  rpc.enqueue('Runtime.callFunctionOn', {
    result: {
      result: {
        type: 'string',
        value: 'Object',
      },
      wasThrown: false,
    },
  })

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
        objectId: 'bun-query-objects-0',
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
  ])
})

test('createBunWebkitRpc - returns a synthetic object for callFunctionOn against synthetic queryObjects', async () => {
  const rpc = createFakeRpc()
  rpc.enqueue('Inspector.enable', { result: {} })
  rpc.enqueue('Runtime.enable', { result: {} })
  rpc.enqueue('Console.enable', { result: {} })
  rpc.enqueue('Inspector.initialized', { result: {} })
  rpc.enqueue('Runtime.callFunctionOn', {
    result: {
      result: {
        type: 'string',
        value: 'Object',
      },
      wasThrown: false,
    },
  })
  const bunRpc = await CreateBunWebkitRpc.createBunWebkitRpc(rpc)
  await bunRpc.invoke('Runtime.queryObjects', {
    objectGroup: 'group-1',
    prototypeObjectId: 'prototype-1',
  })
  const result = await bunRpc.invoke('Runtime.callFunctionOn', {
    functionDeclaration: `function(){
  const objects = this;
  const constructorName = 'EventEmitter'
  const allowFunctions = true
  const isClass = (object) => object.toString().startsWith('class ')
  const isFunction = object => object && typeof object === 'function'
  const isPossibleWidgetConstructor = (object) => object.name === constructorName;
  const functions = objects.filter(isFunction);
  const possibleConstructors = functions.filter(isPossibleWidgetConstructor);
  const widgetConstructor = allowFunctions ? possibleConstructors[0] : possibleConstructors.find(isClass)
  if(!widgetConstructor){ throw new Error('no EventEmitter constructor found') }
  return objects.filter(object => object && object instanceof widgetConstructor)
}`,
    objectGroup: 'group-1',
    objectId: 'bun-query-objects-1',
    returnByValue: false,
  })

  expect(result).toEqual({
    result: {
      result: {
        className: 'Array',
        description: 'Array',
        objectId: 'bun-query-objects-2',
        subtype: 'array',
        type: 'object',
      },
      wasThrown: false,
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
  ])
})

test('createBunWebkitRpc - evaluates by-value callFunctionOn against a synthetic object expression', async () => {
  const rpc = createFakeRpc()
  rpc.enqueue('Inspector.enable', { result: {} })
  rpc.enqueue('Runtime.enable', { result: {} })
  rpc.enqueue('Console.enable', { result: {} })
  rpc.enqueue('Inspector.initialized', { result: {} })
  rpc.enqueue('Runtime.callFunctionOn', {
    result: {
      result: {
        type: 'string',
        value: 'Object',
      },
      wasThrown: false,
    },
  })
  rpc.enqueue('Runtime.evaluate', {
    result: {
      result: {
        type: 'number',
        value: 1,
      },
      wasThrown: false,
    },
  })

  const bunRpc = await CreateBunWebkitRpc.createBunWebkitRpc(rpc)
  await bunRpc.invoke('Runtime.queryObjects', {
    objectGroup: 'group-1',
    prototypeObjectId: 'prototype-1',
  })
  await bunRpc.invoke('Runtime.callFunctionOn', {
    functionDeclaration: `function(){
  const objects = this;
  const constructorName = 'EventEmitter'
  const allowFunctions = true
  const isClass = (object) => object.toString().startsWith('class ')
  const isFunction = object => object && typeof object === 'function'
  const isPossibleWidgetConstructor = (object) => object.name === constructorName;
  const functions = objects.filter(isFunction);
  const possibleConstructors = functions.filter(isPossibleWidgetConstructor);
  const widgetConstructor = allowFunctions ? possibleConstructors[0] : possibleConstructors.find(isClass)
  if(!widgetConstructor){ throw new Error('no EventEmitter constructor found') }
  return objects.filter(object => object && object instanceof widgetConstructor)
}`,
    objectGroup: 'group-1',
    objectId: 'bun-query-objects-3',
    returnByValue: false,
  })
  const result = await bunRpc.invoke('Runtime.callFunctionOn', {
    functionDeclaration: 'function (){ return this.length }',
    objectGroup: 'group-1',
    objectId: 'bun-query-objects-4',
    returnByValue: true,
  })

  expect(result).toEqual({
    result: {
      result: {
        type: 'number',
        value: 1,
      },
      wasThrown: false,
    },
  })
  const expectedExpression = `(function (){ return this.length }).call((() => {
  const constructorName = "EventEmitter"
  const allowFunctions = true
  const isClass = (object) => {
    return object.toString().startsWith('class ')
  }
  const isFunction = object => {
    return object && typeof object === 'function'
  }
  const isPossibleWidgetConstructor = (object) => {
    return object.name === constructorName;
  }
  const functions = queryInstances(Function).filter(isFunction)
  const possibleConstructors = functions.filter(isPossibleWidgetConstructor)
  const widgetConstructor = allowFunctions ? possibleConstructors[0] : possibleConstructors.find(isClass)
  if(!widgetConstructor){
    throw new Error('no EventEmitter constructor found')
  }
  return queryInstances(widgetConstructor)
})())`
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
        awaitPromise: undefined,
        doNotPauseOnExceptionsAndMuteConsole: true,
        expression: expectedExpression,
        includeCommandLineAPI: true,
        objectGroup: 'group-1',
        returnByValue: true,
      },
    },
  ])
})
