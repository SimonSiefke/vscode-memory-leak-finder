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

const logChunk = (key: string, data: string, index: number): void => {
  const preview = data.replaceAll('\n', '\\n').slice(0, 500)
  console.error(`[macos-ci-debug] waitForData key=${JSON.stringify(key)} chunk=${index + 1} length=${data.length} data=${preview}`)
}

export const waitForData = async (stream: ReadableStreamLike, key: string, errorChecker: ErrorChecker): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const dataEvents = await once(stream as NodeJS.ReadableStream, 'data')
    const data = String(dataEvents[0])
    logChunk(key, data, i)
    if (data.includes(key)) {
      return data
    }
    await errorChecker(data, stream)
  }
  return ''
}
