import { expect, test } from '@jest/globals'
import * as LaunchExecWorker from '../src/parts/LaunchExecWorker/LaunchExecWorker.ts'

test('launchExecWorker - returns object with invoke and dispose', async () => {
  const rpc = await LaunchExecWorker.launchExecWorker()

  expect(typeof rpc.invoke).toBe('function')
  expect(typeof rpc[Symbol.asyncDispose]).toBe('function')

  await rpc[Symbol.asyncDispose]()
})

test('launchExecWorker - invoke can be called', async () => {
  const rpc = await LaunchExecWorker.launchExecWorker()

  expect(typeof rpc.invoke).toBe('function')

  await rpc[Symbol.asyncDispose]()
})

test('launchExecWorker - dispose can be called multiple times', async () => {
  const rpc = await LaunchExecWorker.launchExecWorker()

  await rpc[Symbol.asyncDispose]()
  await rpc[Symbol.asyncDispose]()
})
