import { expect, test } from '@jest/globals'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'
import { Inspector } from '../src/parts/StartupProfiles/Inspector.ts'
import { collectStartupProfiles } from '../src/parts/StartupProfiles/StartupProfiles.ts'

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
