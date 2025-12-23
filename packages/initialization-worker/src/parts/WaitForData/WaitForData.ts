import { once } from 'node:events'

interface ReadableStreamLike {
  on(event: 'data', listener: (data: string) => void): unknown
  emit(event: 'data', data: string): boolean
}

type ErrorChecker = (data: string, stream: ReadableStreamLike) => Promise<void> | void

export const waitForData = async (stream: ReadableStreamLike, key: string, errorChecker: ErrorChecker): Promise<string> => {
  for (let i = 0; i < 10; i++) {
    const dataEvents = await once(stream as NodeJS.ReadableStream, 'data')
    const data = dataEvents[0] as string
    if (data.includes(key)) {
      return data
    }
    await errorChecker(data, stream)
  }
  return ''
}
