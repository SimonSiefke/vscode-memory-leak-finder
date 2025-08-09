import { expect, test } from '@jest/globals'
import * as CommandMap from '../src/parts/CommandMap/CommandMap.ts'
import * as VideoWorkerCommandType from '../src/parts/VideoWorkerCommandType/VideoWorkerCommandType.ts'

test('commandMap', () => {
  expect(typeof CommandMap.commandMap).toBe('object')
})

test('commandMap has ConnectDevtools command', () => {
  expect(CommandMap.commandMap[VideoWorkerCommandType.ConnectDevtools]).toBeDefined()
  expect(typeof CommandMap.commandMap[VideoWorkerCommandType.ConnectDevtools]).toBe('function')
})

test('commandMap has VideoRecordingStart command', () => {
  expect(CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingStart]).toBeDefined()
  expect(typeof CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingStart]).toBe('function')
})

test('commandMap has VideoRecordingAddChapter command', () => {
  expect(CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingAddChapter]).toBeDefined()
  expect(typeof CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingAddChapter]).toBe('function')
})

test('commandMap has VideoRecordingFinalize command', () => {
  expect(CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingFinalize]).toBeDefined()
  expect(typeof CommandMap.commandMap[VideoWorkerCommandType.VideoRecordingFinalize]).toBe('function')
})
