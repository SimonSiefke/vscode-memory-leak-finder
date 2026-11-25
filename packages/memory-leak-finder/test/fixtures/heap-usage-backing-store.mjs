import { Session } from 'node:inspector/promises'

const MeasureHeapUsage = await import(new URL('../../src/parts/MeasureHeapUsage/MeasureHeapUsage.ts', import.meta.url).href)
const inspector = new Session()
inspector.connect()
const rpc = {
  /** @param {string} method @param {object} options */
  async invoke(method, options) {
    return { result: await inspector.post(method, options) }
  },
  dispose() {},
}
try {
  await inspector.post('HeapProfiler.collectGarbage')
  const [session] = MeasureHeapUsage.create(rpc)
  const before = await MeasureHeapUsage.start(session)
  const retained = new Uint8Array(new ArrayBuffer(32 * 1024 * 1024)).fill(1)
  const after = await MeasureHeapUsage.stop(session)
  const result = await MeasureHeapUsage.compare(before, after)
  process.stdout.write(`${JSON.stringify({ ...result, retainedBytes: retained.byteLength })}\n`)
} finally {
  inspector.disconnect()
}
