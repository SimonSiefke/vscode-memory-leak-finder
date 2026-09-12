import { expect, test } from '@jest/globals'
import { analyzeScenario, collapseDuplicateCandidates, parseCliArgs } from '../src/analyzeIpcMessagePatterns.ts'

const request = (timestamp: number, id: number, path = '/tmp/file') => ({
  channel: 'vscode:message',
  timestamp,
  type: 'on',
  direction: 'renderer-to-main',
  args: [[100, id, 'localFilesystem', 'stat', [{ path, scheme: 'file' }]]],
})

const response = (timestamp: number, id: number) => ({
  channel: 'vscode:message',
  timestamp,
  type: 'webContents.send',
  direction: 'main-to-renderer',
  args: [[201, id, { size: 42 }]],
})

test('collapseDuplicateCandidates collapses identical captures within the configured window', () => {
  const messages = [request(1, 7), request(3, 7), response(4, 7), response(6, 7)]

  const result = collapseDuplicateCandidates(messages, 10)

  expect(result.rows).toHaveLength(2)
  expect(result.duplicateMessages).toBe(2)
  expect(result.duplicatePayloadBytes).toBeGreaterThan(0)
})

test('analyzeScenario maps responses to protocol operations', () => {
  const analysis = analyzeScenario('base', 'base.json', [request(1, 7), response(2, 7)])
  const operation = analysis.summary.operations.find((item) => item.operation === 'call localFilesystem.stat')

  expect(analysis.summary.protocolCalls).toBe(1)
  expect(operation).toMatchObject({
    messages: 2,
    requests: 1,
    responses: 1,
  })
})

test('analyzeScenario reports unused bytes in file read response buffers', () => {
  const analysis = analyzeScenario('base', 'base.json', [
    request(1, 7),
    {
      channel: 'vscode:message',
      timestamp: 2,
      type: 'webContents.send',
      direction: 'main-to-renderer',
      args: [[201, 7, [{ type: 'Buffer', data: [1, 2, 0, 0] }, 2]]],
    },
  ])

  expect(analysis.summary.bufferWaste).toEqual([
    {
      operation: 'call localFilesystem.stat',
      responses: 1,
      allocatedBytes: 4,
      usedBytes: 2,
      wastedBytes: 2,
      wastedPercentage: 50,
    },
  ])
})

test('analyzeScenario reports repeated logical requests outside the duplicate window', () => {
  const analysis = analyzeScenario('base', 'base.json', [request(1, 7), response(2, 7), request(30, 8), response(31, 8)])

  expect(analysis.summary.logicalMessages).toBe(4)
  expect(analysis.summary.repeatedRequests).toEqual([
    expect.objectContaining({
      operation: 'call localFilesystem.stat',
      count: 2,
    }),
  ])
})

test('analyzeScenario redacts credential-like fields from samples', () => {
  const analysis = analyzeScenario('base', 'base.json', [
    {
      channel: 'vscode:fetchShellEnv',
      timestamp: 1,
      type: 'handle-response',
      result: { SAFE: 'visible', ACCESS_TOKEN: 'do-not-write' },
    },
  ])

  expect(analysis.summary.largestMessages[0]?.sample).toContain('"ACCESS_TOKEN":"[redacted]"')
  expect(analysis.summary.largestMessages[0]?.sample).not.toContain('do-not-write')
})

test('parseCliArgs applies defaults and overrides', () => {
  expect(parseCliArgs(['--input', 'traces', '--json', 'out.json', '--top', '12', '--duplicate-window-ms', '5'])).toEqual({
    inputDirectory: 'traces',
    jsonPath: 'out.json',
    top: 12,
    duplicateWindowMs: 5,
  })
})
