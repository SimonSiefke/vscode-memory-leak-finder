import { expect, test } from '@jest/globals'
import * as Main from '../src/parts/Main/Main.ts'

test('main function exists', () => {
  expect(typeof Main.main).toBe('function')
})

test('main should throw IpcError when parentPort not available', async () => {
  await expect(Main.main()).rejects.toThrow('parentPort is required for node worker threads ipc')
})
