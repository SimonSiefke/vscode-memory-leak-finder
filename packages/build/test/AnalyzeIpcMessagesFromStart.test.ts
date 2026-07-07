import { expect, test } from '@jest/globals'
import {
  analyzeMessages,
  createSvgChart,
  extractMessages,
  getDefaultOutputPaths,
  parseCliArgs,
} from '../src/analyzeIpcMessagesFromStart.ts'

const getCategory = (summary: ReturnType<typeof analyzeMessages>, id: string) => {
  const category = summary.categories.find((item) => item.id === id)
  expect(category).toBeDefined()
  return category!
}

test('extractMessages supports wrapper object input', () => {
  const messages = [{ type: 'send', channel: 'test', args: [] }]

  expect(extractMessages({ ipcMessagesFromStart: messages })).toBe(messages)
})

test('extractMessages supports raw array input', () => {
  const messages = [{ type: 'send', channel: 'test', args: [] }]

  expect(extractMessages(messages)).toBe(messages)
})

test('analyzeMessages prioritizes extension manifests before file metadata', () => {
  const messages = [
    {
      type: 'send',
      channel: 'vscode:message',
      args: [
        [
          201,
          101,
          {
            input: {
              location: {
                fsPath: '/tmp/resources/app/extensions',
                scheme: 'file',
              },
              mtime: 1,
            },
            result: [
              {
                identifier: { id: 'vscode.git' },
                manifest: {
                  name: 'git',
                  publisher: 'vscode',
                  activationEvents: ['onStartupFinished'],
                },
              },
            ],
          },
        ],
      ],
    },
  ]

  const summary = analyzeMessages(messages, 'input.json')

  expect(getCategory(summary, 'extension-manifests').count).toBe(1)
  expect(summary.categories.find((item) => item.id === 'file-metadata')).toBeUndefined()
})

test('analyzeMessages aggregates bytes and message counts by category', () => {
  const messages = [
    {
      type: 'handle-response',
      channel: 'vscode:hello',
      result: {
        appRoot: '/tmp/app',
        execPath: '/tmp/code',
        'user-data-dir': '/tmp/user-data',
      },
    },
    {
      type: 'send',
      channel: 'vscode:message',
      args: [[201, 15, [['telemetry.currentSessionDate', 'Tue, 07 Jul 2026 09:43:42 GMT']]]],
    },
  ]
  const expectedBytes = messages.reduce((total, message) => total + Buffer.byteLength(JSON.stringify(message)), 0)

  const summary = analyzeMessages(messages, 'input.json')

  expect(summary.totalMessages).toBe(2)
  expect(summary.totalBytes).toBe(expectedBytes)
  expect(getCategory(summary, 'startup-config').count).toBe(1)
  expect(getCategory(summary, 'storage-data').count).toBe(1)
})

test('analyzeMessages reports duplicate payloads without timestamp noise', () => {
  const messages = [
    {
      type: 'send',
      channel: 'vscode:message',
      timestamp: 1,
      args: [[204, 910, { type: 'Buffer', data: [1, 2, 3] }]],
    },
    {
      type: 'send',
      channel: 'vscode:message',
      timestamp: 2,
      args: [[204, 910, { type: 'Buffer', data: [1, 2, 3] }]],
    },
  ]

  const summary = analyzeMessages(messages, 'input.json')

  expect(summary.duplicatePayloads).toHaveLength(1)
  expect(summary.duplicatePayloads[0]?.count).toBe(2)
  expect(summary.duplicatePayloads[0]?.command).toBe('204:910')
})

test('createSvgChart includes slices and legend labels', () => {
  const summary = analyzeMessages(
    [
      {
        type: 'send',
        channel: 'vscode:message',
        args: [[201, 725, { 'github.copilot.command.explainThis': 'Explain' }]],
      },
      {
        type: 'send',
        channel: 'vscode:message',
        args: [[204, 910, { type: 'Buffer', data: [1, 2, 3] }]],
      },
    ],
    'input.json',
  )

  const svg = createSvgChart(summary)

  expect(svg).toContain('<svg')
  expect(svg).toContain('<circle')
  expect(svg).toContain('NLS data')
  expect(svg).toContain('File content')
})

test('getDefaultOutputPaths derives analysis paths from input path', () => {
  expect(getDefaultOutputPaths('results/ipc.json')).toEqual({
    jsonPath: 'results/ipc.analysis.json',
    svgPath: 'results/ipc.analysis.svg',
  })
})

test('parseCliArgs applies defaults and overrides', () => {
  expect(parseCliArgs(['--input', 'custom.json', '--json', 'out.json', '--svg', 'out.svg', '--top', '3', '--no-svg'])).toEqual({
    inputPath: 'custom.json',
    jsonPath: 'out.json',
    svgPath: 'out.svg',
    top: 3,
    writeSvg: false,
  })
})
