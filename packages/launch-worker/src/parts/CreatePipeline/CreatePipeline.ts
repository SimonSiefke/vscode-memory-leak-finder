import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { PortStream } from '../PortStream/PortStream.ts'

export const createPipeline = (stream: Readable) => {
  const { port1, port2 } = new MessageChannel()

  const controller = new AbortController()
  // @ts-ignore
  const pipelinePromise = pipeline(stream, new PortStream(port2), {
    signal: controller.signal,
  })

  return {
    async [Symbol.asyncDispose]() {
      port2.close()
      await Promise.allSettled([pipelinePromise, controller.abort()])
    },
    port: port1,
  }
}
