import { expect, test } from '@jest/globals'
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import { WebSocketServer } from 'ws'
import { Inspector } from '../src/parts/StartupProfiles/Inspector.ts'
import { collectStartupProfiles } from '../src/parts/StartupProfiles/StartupProfiles.ts'

test('startup profiling collects script metadata without pausing an inspect-brk process', async () => {
  const child = spawn(process.execPath, [
    '--inspect-brk=127.0.0.1:0',
    '-e',
    'process.stdout.write("started"); setInterval(() => {}, 1000)\n//# sourceURL=startup-profiling-test.js',
  ])
  let session: Inspector | undefined
  let output = ''
  child.stdout.on('data', (data) => (output += data.toString()))
  try {
    const url = await new Promise<string>((resolve, reject) => {
      child.once('error', reject)
      child.stderr.on('data', (data) => {
        const match = data.toString().match(/ws:\/\/\S+/)
        if (match) resolve(match[0])
      })
    })
    session = await Inspector.connect(url)
    const scripts: string[] = []
    session.on('Debugger.scriptParsed', ({ url }) => scripts.push(url))
    await session.startProfiling()
    await session.invoke('Runtime.runIfWaitingForDebugger')
    for (let attempt = 0; attempt < 100 && (output !== 'started' || !scripts.includes('startup-profiling-test.js')); attempt++)
      await delay(10)
    expect(output).toBe('started')
    expect(scripts).toContain('startup-profiling-test.js')
    const { profile } = await session.invoke('Profiler.stop')
    expect(profile.samples.length).toBeGreaterThan(0)
  } finally {
    session?.dispose()
    const exited = once(child, 'exit')
    child.kill()
    await exited
  }
})

test('inspector correlates out-of-order replies, surfaces protocol errors and releases pending requests', async () => {
  const server = createServer()
  const wss = new WebSocketServer({ server })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  if (!address || typeof address === 'string') throw new Error('No port')
  wss.on('connection', (socket) =>
    socket.on('message', (data) => {
      const { id, method } = JSON.parse(data.toString())
      if (method === 'pending') return
      const response = method === 'fail' ? { id, error: { message: 'failed' } } : { id, result: method }
      setTimeout(() => socket.send(JSON.stringify(response)), method === 'first' ? 20 : 0)
    }),
  )
  const session = await Inspector.connect(`ws://127.0.0.1:${address.port}`)
  try {
    expect(await Promise.all([session.invoke('first'), session.invoke('second')])).toEqual(['first', 'second'])
    await expect(session.invoke('fail')).rejects.toThrow('failed')
    const pending = session.invoke('pending')
    session.dispose()
    await expect(pending).rejects.toThrow('disposed')
  } finally {
    session.dispose()
    await new Promise<void>((resolve) => wss.close(() => resolve()))
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
})

test('invalid counts are rejected before launching VS Code', async () => {
  if (process.platform !== 'linux') return
  await expect(collectStartupProfiles('/missing', '/unused', NaN)).rejects.toThrow('samples must')
  await expect(collectStartupProfiles('/missing', '/unused', 1.5)).rejects.toThrow('samples must')
})
