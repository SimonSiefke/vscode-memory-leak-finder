import assert from 'node:assert'
import type { TestContext } from '../types.ts'

interface Measurement {
  readonly durationMs: number
  readonly heapUsedDelta: number
  readonly rssDelta: number
  readonly value: string
}

interface DataResponse {
  readonly control: Measurement
  readonly formatter: Measurement
  readonly iterations: number
  readonly nodeMajorVersion: number
  readonly ok: boolean
  readonly outputsMatch: boolean
}

export const skip = Number.parseInt(process.versions.node, 10) < 22

const createServerSource = () => {
  return `import http from 'node:http'

const port = Number(process.env.MEMORY_LEAK_FINDER_SERVER_PORT)
const iterations = 5_000
const locale = 'en-US'
const fixedDate = new Date('2025-02-26T12:34:56.000Z')
const options = {
  dateStyle: 'medium',
  timeStyle: 'long',
  timeZone: 'UTC',
  hourCycle: 'h23',
}

const runGc = () => {
  if (typeof global.gc !== 'function') {
    throw new Error('Expected global.gc to be available for Node external runtime tests')
  }
  global.gc()
}

const measure = (format) => {
  runGc()
  const before = process.memoryUsage()
  const started = Date.now()
  let value = ''
  for (let i = 0; i < iterations; i++) {
    value = format()
  }
  runGc()
  const after = process.memoryUsage()
  return {
    durationMs: Date.now() - started,
    heapUsedDelta: after.heapUsed - before.heapUsed,
    rssDelta: after.rss - before.rss,
    value,
  }
}

const measureControl = () => {
  return measure(() => fixedDate.toLocaleString(locale, options))
}

const measureFormatter = () => {
  return measure(() => Intl.DateTimeFormat(locale, options).format(fixedDate))
}

const server = http.createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ ok: true }))
    return
  }

  if (request.url === '/data') {
    const control = measureControl()
    const formatter = measureFormatter()
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(
      JSON.stringify({
        control,
        formatter,
        iterations,
        nodeMajorVersion: Number.parseInt(process.versions.node, 10),
        ok: true,
        outputsMatch: control.value === formatter.value,
      }),
    )
    return
  }

  response.writeHead(404, { 'content-type': 'application/json' })
  response.end(JSON.stringify({ ok: false }))
})

server.listen(port, '127.0.0.1')
`
}

export const setup = async ({ Editor, Explorer, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()

  const { inspectPort, serverPort } = await ExternalRuntime.createPorts()
  await ExternalRuntime.startExternalRuntime({
    entryFile: 'server.js',
    entrySource: createServerSource(),
    inspectPort,
    runtimeName: 'node',
    serverPort,
  })
}

export const run = async ({ ExternalRuntime }: TestContext): Promise<void> => {
  const body = (await ExternalRuntime.getJson('/data')) as DataResponse
  assert.strictEqual(body.ok, true)
  assert.strictEqual(body.outputsMatch, true)
  assert.strictEqual(body.nodeMajorVersion >= 22, true)
  assert.strictEqual(body.iterations, 5_000)
  assert.strictEqual(body.control.value, body.formatter.value)
  assert.strictEqual(body.control.rssDelta < 30_000_000, true)
  assert.strictEqual(body.formatter.rssDelta > 40_000_000, true)
  assert.strictEqual(body.formatter.rssDelta > body.control.rssDelta + 20_000_000, true)
}

export const teardown = async ({ Editor, ExternalRuntime, Terminal, Workspace }: TestContext): Promise<void> => {
  await ExternalRuntime.dispose()
  await Terminal.killAll()
  await Editor.closeAll()
  await Workspace.setFiles([])
}