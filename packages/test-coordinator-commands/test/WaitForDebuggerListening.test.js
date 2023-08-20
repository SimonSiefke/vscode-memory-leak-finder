import EventEmitter from 'node:events'
import * as WaitForDebuggerListening from '../src/parts/WaitForDebuggerListening/WaitForDebuggerListening.js'

test('waitForDebuggerListening - error - address already in use', async () => {
  // @ts-ignore
  const stream = new EventEmitter()
  // @ts-ignore
  stream.setEncoding = () => {}

  setTimeout(() => {
    stream.emit('data', `Starting inspector on 127.0.0.1:4444 failed: address already in use\n`)
  }, 0)
  await expect(WaitForDebuggerListening.waitForDebuggerListening(stream)).rejects.toThrowError(
    new Error(`Starting inspector on 127.0.0.1:4444 failed: address already in use`)
  )
})
