import { Session } from 'node:inspector/promises'
import { createContext, runInContext } from 'node:vm'
import * as Measure from '../../src/parts/MeasurePromisesWithStackTrace/MeasurePromisesWithStackTrace.ts'
import { combine } from '../../src/parts/MeasureCombined/MeasureCombined.ts'
import { prepare } from '../../src/parts/MemoryLeakFinderPrepare/MemoryLeakFinderPrepare.ts'
import { releaseResources } from '../../src/parts/MemoryLeakFinderReleaseResources/MemoryLeakFinderReleaseResources.ts'
import * as MemoryLeakFinderState from '../../src/parts/MemoryLeakFinderState/MemoryLeakFinderState.ts'
import { wrapMeasure } from '../../src/parts/WrapMeasure/WrapMeasure.ts'

const mode = process.argv[2]
const inspector = new Session()
inspector.connect()
let contextId = 0
let failCapture = false
/** @type {(method: string, options?: object) => Promise<any>} */
const post = inspector.post.bind(inspector)
inspector.on('Runtime.executionContextCreated', ({ params }) => {
  if (params.context.name === 'promise-stack-traces') {
    contextId = params.context.id
  }
})
await inspector.post('Runtime.enable')
const context = createContext({}, { name: 'promise-stack-traces' })
runInContext(
  `globalThis.originalPromise = Promise;
   globalThis.items = [];
   globalThis.runWorkload = function runWorkload() {
     const next = Array.from({length: 100}, () => ({cache: Promise.resolve()}));
     items = ${mode === 'growing' ? 'items.concat(next)' : 'next'};
   };`,
  context,
)
const rpc = {
  /** @param {string} method @param {Record<string, unknown>} options */
  async invoke(method, options) {
    if (failCapture && method === 'Runtime.queryObjects') {
      throw new Error('capture failed')
    }
    if (mode === 'prepare-failure' && method === 'Runtime.evaluate' && String(options.expression).includes('Promise = class')) {
      throw new Error('prepare failed')
    }
    return { result: await post(method, method === 'Runtime.evaluate' ? { ...options, contextId } : options) }
  },
  /** @param {string} event @param {(...args: any[]) => void} listener */
  on: (event, listener) => inspector.on(event, listener),
  /** @param {string} event @param {(...args: any[]) => void} listener */
  off: (event, listener) => inspector.off(event, listener),
  dispose() {},
}
/** @param {string} expression */
const evaluate = async (expression) => {
  const result = await post('Runtime.evaluate', { contextId, expression, returnByValue: true })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception.description)
  }
  return result.result.value
}
const run = () => evaluate('runWorkload(); undefined')
const session = /** @type {any} */ (rpc)
const measure = combine(wrapMeasure(Measure).create(session))
MemoryLeakFinderState.set(1, { measure, pid: process.pid, rpc: session })
try {
  // Preparation must precede warmup, while start captures the warmed baseline.
  await prepare(1)
  await run()
  if (mode === 'warmup-failure') {
    throw new Error('warmup failed')
  }
  await run()
  const before = await measure.start()
  for (let i = 0; i < 37; i++) {
    await run()
  }
  await inspector.post('HeapProfiler.collectGarbage')
  failCapture = mode === 'capture-failure'
  const after = await measure.stop()
  const result = await Measure.compare(before[Measure.id], after[Measure.id].result, { runs: 37 })
  const rows = result.filter(
    /** @param {{stackTrace: string[]}} item */ (item) => item.stackTrace.some((line) => line.includes('runWorkload')),
  )
  process.stdout.write(JSON.stringify({ rows, restored: await evaluate('Promise === originalPromise') }) + '\n')
} catch (error) {
  if (!mode?.endsWith('-failure')) {
    throw error
  }
  await releaseResources(1)
  process.stdout.write(
    JSON.stringify({
      error: String(error),
      restored: await evaluate('Promise === originalPromise'),
      trackingRemoved: await evaluate('!("___promiseStackTraces" in globalThis) && !("___originalPromise" in globalThis)'),
      scriptListeners: inspector.listenerCount('Debugger.scriptParsed'),
    }) + '\n',
  )
} finally {
  await releaseResources(1)
  inspector.disconnect()
}
