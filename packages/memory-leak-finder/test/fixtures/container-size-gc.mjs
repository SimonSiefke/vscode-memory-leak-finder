import { Session } from 'node:inspector/promises'

const kind = process.argv[2]
const getter = await import(`../../src/parts/Get${kind}Size/Get${kind}Size.ts`)
const inspector = new Session()
inspector.connect()
const rpc = {
  /** @param {string} method @param {object} options */
  async invoke(method, options) {
    return { result: await inspector.post(method, options) }
  },
  dispose() {},
}
/** @param {string} expression */
const evaluate = async (expression) => inspector.post('Runtime.evaluate', { expression, returnByValue: true })
try {
  await evaluate(
    `globalThis.containers = Array.from({length: 10}, () => new ${kind}()); globalThis.references = containers.map(x => new WeakRef(x)); undefined`,
  )
  await getter[`get${kind}Size`](rpc)
  await evaluate('globalThis.containers = undefined')
  await new Promise((resolve) => setTimeout(resolve, 0))
  await inspector.post('HeapProfiler.collectGarbage')
  await inspector.post('HeapProfiler.collectGarbage')
  const result = await evaluate('references.filter(ref => ref.deref() !== undefined).length')
  console.log(result.result.value)
} finally {
  inspector.disconnect()
}
