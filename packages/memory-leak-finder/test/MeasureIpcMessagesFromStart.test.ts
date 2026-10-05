import { expect, test } from '@jest/globals'
import * as MeasureIpcMessagesFromStart from '../src/parts/MeasureIpcMessagesFromStart/MeasureIpcMessagesFromStart.ts'
import * as TargetId from '../src/parts/TargetId/TargetId.ts'

test('MeasureIpcMessagesFromStart has expected id and target', () => {
  expect(MeasureIpcMessagesFromStart.id).toBe('ipcMessagesFromStart')
  expect(MeasureIpcMessagesFromStart.targets).toEqual([TargetId.Node])
})

test('MeasureIpcMessagesFromStart.compare returns all final ipc messages', () => {
  const oldMessage = { channel: 'old' }
  const newMessage = { channel: 'new' }
  const result = MeasureIpcMessagesFromStart.compare([oldMessage], [oldMessage, newMessage])
  expect(result).toEqual([oldMessage, newMessage])
})

test('MeasureIpcMessagesFromStart.start uses an empty baseline', async () => {
  const result = await MeasureIpcMessagesFromStart.start({} as any, 'test-object-group')
  expect(result).toEqual([])
})
