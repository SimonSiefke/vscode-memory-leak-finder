import assert from 'node:assert/strict'
import { test } from 'node:test'
import { verifyMainProcess } from '../src/identity.ts'

const identity = { pid: 123, type: 'browser', electron: '44.9.2' }

test('accepts the launched Electron main process', () => {
  assert.doesNotThrow(() => verifyMainProcess(identity, 123))
})

test('rejects another Electron main process, including a running VS Code instance', () => {
  assert.throws(() => verifyMainProcess({ ...identity, pid: 456 }, 123), /Expected launched Electron main process/)
})

test('rejects a renderer even if its pid matches', () => {
  assert.throws(() => verifyMainProcess({ ...identity, type: 'renderer' }, 123))
})

test('rejects a regular Node process and a missing spawned pid', () => {
  assert.throws(() => verifyMainProcess({ ...identity, electron: '' }, 123))
  assert.throws(() => verifyMainProcess(identity, undefined))
})
