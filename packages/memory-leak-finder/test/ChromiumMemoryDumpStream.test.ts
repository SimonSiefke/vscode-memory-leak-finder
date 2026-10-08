import { expect, test } from '@jest/globals'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { AddressInfo } from 'node:net'
import { WebSocketServer } from 'ws'
import * as Capture from '../src/parts/ChromiumMemoryDumpCapture/ChromiumMemoryDumpCapture.ts'
import * as Connection from '../src/parts/DebuggerCreateIpcConnection/DebuggerCreateIpcConnection.ts'
import * as Measure from '../src/parts/MeasureChromiumMemoryDump/MeasureChromiumMemoryDump.ts'

async function captureTrace(paddingBytes: number, compressed: boolean) {
  const directory = await mkdtemp(join(tmpdir(), 'chromium-stream-test-'))
  const server = new WebSocketServer({ host: '127.0.0.1', port: 0, perMessageDeflate: compressed })
  await new Promise<void>((resolve) => server.once('listening', resolve))
  const traceEvents = [
    { args: { name: 'Renderer Ω' }, name: 'process_name', ph: 'M', pid: 10 },
    ...['100', '180'].map((footprint, index) => ({
      args: { dumps: { level_of_detail: 'detailed', process_totals: { private_footprint_bytes: footprint } } },
      id: `0x${index}`,
      ph: 'v',
      pid: 10,
      ts: index + 1,
    })),
    { args: { padding: 'x'.repeat(paddingBytes) }, name: 'transport-control', ph: 'i', pid: 10 },
  ]
  const rawTrace = Buffer.from(JSON.stringify({ traceEvents }))
  let mode = ''
  let offset = 0
  let closedStream = false
  let maxReadSize = 0
  const connectionClosed = Promise.withResolvers<boolean>()
  server.on('connection', (socket) => {
    socket.once('close', () => connectionClosed.resolve(false))
    socket.on('message', (data) => {
      const message = JSON.parse(String(data))
      let result = {}
      if (message.method === 'Tracing.start') mode = message.params.transferMode
      if (message.method === 'Tracing.requestMemoryDump') result = { dumpGuid: '0x2', success: true }
      if (message.method === 'IO.read') {
        maxReadSize = Math.max(maxReadSize, message.params.size)
        const chunk = rawTrace.subarray(offset, offset + message.params.size)
        offset += chunk.length
        result = { data: chunk.toString('base64'), base64Encoded: true, eof: offset === rawTrace.length }
      }
      if (message.method === 'IO.close') closedStream = true
      socket.send(JSON.stringify({ id: message.id, result }))
      if (message.method === 'Tracing.end') {
        if (mode === 'ReturnAsStream') {
          socket.send(JSON.stringify({ method: 'Tracing.tracingComplete', params: { stream: 'owned-trace', dataLossOccurred: false } }))
        } else {
          socket.send(JSON.stringify({ method: 'Tracing.dataCollected', params: { value: traceEvents } }), { compress: compressed })
          socket.send(JSON.stringify({ method: 'Tracing.tracingComplete', params: { dataLossOccurred: false } }))
        }
      }
    })
  })
  let rpc: Awaited<ReturnType<typeof Connection.createConnection>> | undefined
  let state: Capture.ChromiumMemoryDumpCaptureState | undefined
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    rpc = await Connection.createConnection(`ws://127.0.0.1:${(server.address() as AddressInfo).port}`)
    const session = { ...rpc, invokeBrowser: rpc.invoke }
    state = Capture.create(session, join(directory, 'trace.json'))
    await Capture.start(state)
    const stop = Capture.stop(state)
    const completed = await Promise.race([
      stop.then(() => true),
      connectionClosed.promise,
      new Promise<boolean>((resolve) => {
        timeout = setTimeout(() => resolve(false), 3000)
      }),
    ])
    if (!completed) return { completed, mode, closedStream, maxReadSize, paddingBytes: 0, dumpCount: 0, footprintDelta: 0 }
    const capture = JSON.parse(await readFile(state.capturePath, 'utf8'))
    const events = capture.trace?.traceEvents ?? capture.traceEvents
    const result = await Measure.compare(null, await stop)
    return {
      completed,
      mode,
      closedStream,
      maxReadSize,
      paddingBytes: events.find((event: { name?: string }) => event.name === 'transport-control').args.padding.length,
      dumpCount: result.dumpCount,
      footprintDelta: result.processes[0].delta.privateFootprintBytes,
    }
  } finally {
    clearTimeout(timeout)
    // A failing legacy transport can leave stop pending. Tear down only this test's state/socket.
    if (state) {
      state.active = false
      await Capture.release(state)
    }
    rpc?.dispose()
    for (const client of server.clients) client.terminate()
    await new Promise<void>((resolve) => server.close(() => resolve()))
    await rm(directory, { recursive: true, force: true })
  }
}

test.each([
  ['small compressed control', 3 * 1024 * 1024, true],
  ['large uncompressed control', 5 * 1024 * 1024, false],
  ['large compressed trace', 5 * 1024 * 1024, true],
] as const)(
  '%s preserves complete trace data and exact dump metrics',
  async (_name, bytes, compressed) => {
    const result = await captureTrace(bytes, compressed)
    expect({
      completed: result.completed,
      paddingBytes: result.paddingBytes,
      dumpCount: result.dumpCount,
      footprintDelta: result.footprintDelta,
    }).toEqual({ completed: true, paddingBytes: bytes, dumpCount: 2, footprintDelta: 128 })
  },
  10000,
)

test('stream requests are bounded and the owned stream is closed', async () => {
  const result = await captureTrace(5 * 1024 * 1024, true)
  expect({
    completed: result.completed,
    mode: result.mode,
    closedStream: result.closedStream,
    bounded: result.maxReadSize > 0 && result.maxReadSize <= 256 * 1024,
  }).toEqual({ completed: true, mode: 'ReturnAsStream', closedStream: true, bounded: true })
}, 10000)
