import { once } from 'node:events'

interface ReadableStreamLike {
  emit(event: 'data', data: string): boolean
  on(event: 'data', listener: (data: string | Buffer) => void): unknown
  on(event: 'end' | 'close', listener: () => void): unknown
  on(event: 'error', listener: (error: unknown) => void): unknown
  off?(event: 'data', listener: (data: string | Buffer) => void): unknown
  off?(event: 'end' | 'close', listener: () => void): unknown
  off?(event: 'error', listener: (error: unknown) => void): unknown
  removeListener?(event: 'data', listener: (data: string | Buffer) => void): unknown
  removeListener?(event: 'end' | 'close', listener: () => void): unknown
  removeListener?(event: 'error', listener: (error: unknown) => void): unknown
}

type ErrorChecker = (data: string, stream: ReadableStreamLike) => Promise<void> | void

const MACOS_IDLE_TIMEOUT = 60_000

const logChunk = (key: string, data: string, index: number): void => {
  const preview = data.replaceAll('\n', '\\n').slice(0, 500)
  console.error(`[macos-ci-debug] waitForData key=${JSON.stringify(key)} chunk=${index + 1} length=${data.length} data=${preview}`)
}

const waitForDataEvent = async (stream: ReadableStreamLike, key: string): Promise<readonly unknown[]> => {
  if (process.platform !== 'darwin') {
    return once(stream as NodeJS.ReadableStream, 'data')
  }
  let timeout: NodeJS.Timeout | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        timeout = undefined
        reject(new Error(`No output received while waiting for ${JSON.stringify(key)} after ${MACOS_IDLE_TIMEOUT}ms on macOS`))
      }, MACOS_IDLE_TIMEOUT)
      timeout.unref?.()
    })
    return await Promise.race([once(stream as NodeJS.ReadableStream, 'data'), timeoutPromise])
  } finally {
    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

export const waitForData = async (stream: ReadableStreamLike, key: string, errorChecker: ErrorChecker): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const dataEvents = await waitForDataEvent(stream, key)
    const data = String(dataEvents[0])
    logChunk(key, data, i)
    if (data.includes(key)) {
      return data
    }
    await errorChecker(data, stream)
  }
  return ''
}
