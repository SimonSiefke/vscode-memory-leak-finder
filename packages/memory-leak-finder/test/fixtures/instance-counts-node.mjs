import assert from 'node:assert/strict'
import { Session } from 'node:inspector/promises'

const measure = await import(
  new URL('../../src/parts/MeasureInstanceCountsDifference/MeasureInstanceCountsDifference.ts', import.meta.url).href
)
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
const [target, group] = measure.create(rpc)
try {
  await evaluate('globalThis.__ownedInstanceMeasureControl = [new (class OwnedNodeInstanceControl {})()]; undefined')
  const before = await measure.start(target, group)
  await evaluate(`(() => {
    const Control = globalThis.__ownedInstanceMeasureControl[0].constructor
    globalThis.__ownedInstanceMeasureControl.push(new Control(), new Control(), new Control())
  })()`)
  const after = await measure.stop(target, group)
  const changes = await measure.compare(before, after)
  const control = changes.find((/** @type {{ name: string }} */ item) => item.name === 'OwnedNodeInstanceControl')
  assert.equal(control?.delta, 3)
  console.log(JSON.stringify(control))
} finally {
  await evaluate('delete globalThis.__ownedInstanceMeasureControl')
  await measure.releaseResources(target, group)
  inspector.disconnect()
}
