import { once } from 'node:events'

interface ReadableStreamLike {
  emit(event: 'data', data: string): boolean
  on(event: string, listener: (...args: any[]) => void): unknown
  removeListener(event: string, listener: (...args: any[]) => void): unknown
}

type ErrorChecker = (data: string, stream: ReadableStreamLike, signal: AbortSignal) => Promise<void> | void

export const waitForData = async (stream: ReadableStreamLike, key: string, errorChecker: ErrorChecker): Promise<string> => {
  const timeoutMs = 5 * 60 * 1000
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort(new Error(`Timed out after ${timeoutMs}ms waiting for ${key}`))
  }, timeoutMs)
  const onClose = () => controller.abort(new Error(`Output closed while waiting for ${key}`))
  stream.on('end', onClose)
  stream.on('close', onClose)
  try {
    for (let i = 0; i < 10; i++) {
      const dataEvents = await once(stream as NodeJS.ReadableStream, 'data', { signal: controller.signal })
      const data = dataEvents[0] as string
      if (data.includes(key)) {
        return data
      }
      await errorChecker(data, stream, controller.signal)
    }
    return ''
  } catch (error) {
    if (controller.signal.aborted) {
      throw controller.signal.reason
    }
    throw error
  } finally {
    clearTimeout(timeout)
    stream.removeListener('end', onClose)
    stream.removeListener('close', onClose)
  }
}
