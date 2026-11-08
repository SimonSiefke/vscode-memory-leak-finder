import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import { expect, test } from '@jest/globals'
import * as GetInstances from '../src/parts/GetInstances/GetInstances.ts'
import type { Session } from '../src/parts/Session/Session.ts'

interface RuntimeOptions {
  readonly expression?: string
  readonly functionDeclaration?: string
  readonly objectGroup: string
  readonly objectId?: string
  readonly prototypeObjectId?: string
  readonly returnByValue?: boolean
}

const executeFilter = async (source: string): Promise<readonly object[]> => {
  const context = createContext({})
  const objects: object[] = runInContext(source, context)
  const calls: string[] = []
  const session = {
    async invoke(method: string, options: RuntimeOptions) {
      calls.push(method)
      expect(options.objectGroup).toBe('owned-group')
      if (method === 'Runtime.evaluate') {
        expect(options.expression).toBe('Object.prototype')
        return { result: { result: { objectId: 'prototype' } } }
      }
      if (method === 'Runtime.queryObjects') {
        expect(options.prototypeObjectId).toBe('prototype')
        return { result: { objects: { objectId: 'objects' } } }
      }
      expect(method).toBe('Runtime.callFunctionOn')
      expect(options.objectId).toBe('objects')
      expect(options.returnByValue).toBe(false)
      const filter = runInContext(`(${options.functionDeclaration})`, context)
      // Execute the actual transmitted payload in its own target realm;
      // no mutation of Jest's globals or replacement filtering algorithm.
      return { result: { result: { value: Reflect.apply(filter, objects, []) } } }
    },
    dispose() {},
  } as Session
  const result = await GetInstances.getInstances(session, 'owned-group')
  expect(calls).toEqual(['Runtime.evaluate', 'Runtime.queryObjects', 'Runtime.callFunctionOn'])
  return result
}

test('counts application instances without optional DOM globals', async () => {
  const result = await executeFilter(`
    class ApplicationInstance {}
    [new ApplicationInstance(), {}, [], new Map(), new Set(), new Uint8Array(), Promise.resolve()]
  `)
  expect(result.map((object) => object.constructor.name)).toEqual(['ApplicationInstance'])
})

test('excludes available native constructors in a partial DOM realm', async () => {
  const result = await executeFilter(`
    globalThis.Node = class NativeNode {}
    class ApplicationInstance {}
    [new Node(), new ApplicationInstance()]
  `)
  expect(result.map((object) => object.constructor.name)).toEqual(['ApplicationInstance'])
})

test('preserves browser constructor identity filtering', async () => {
  const result = await executeFilter(`
    globalThis.Node = class NativeNode {}
    globalThis.HTMLDivElement = class NativeDiv extends Node {}
    globalThis.DOMRect = class NativeRect {}
    const ApplicationInstance = class HTMLDivElement {};
    [new Node(), new HTMLDivElement(), new DOMRect(), new ApplicationInstance()]
  `)
  expect(result.map((object) => object.constructor.name)).toEqual(['HTMLDivElement'])
})

test('continues excluding async and generator functions', async () => {
  const result = await executeFilter(`
    class ApplicationInstance {}
    [async () => {}, function* () {}, async function* () {}, () => {}, new ApplicationInstance()]
  `)
  expect(result.map((object) => object.constructor.name)).toEqual(['ApplicationInstance'])
})

test('native DOM-less Node inspector reports the deliberately retained instance delta', async () => {
  const fixture = fileURLToPath(new URL('./fixtures/instance-counts-node.mjs', import.meta.url))
  const { stdout } = await promisify(execFile)(process.execPath, [fixture], { timeout: 20000, maxBuffer: 65536 })
  expect(JSON.parse(stdout)).toEqual({ name: 'OwnedNodeInstanceControl', count: expect.any(Number), delta: 3 })
}, 25000)
