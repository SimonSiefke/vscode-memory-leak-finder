import assert from 'node:assert/strict'
import { Session } from 'node:inspector/promises'

/** @param {string} part */
const load = async (part) => import(new URL(`../../src/parts/${part}/${part}.ts`, import.meta.url).href)
const { getInstanceCountMap } = await load('GetInstanceCountMap')
const { getInstanceCountArray } = await load('GetInstanceCountArray')
const { compareInstanceCountsDifference } = await load('CompareInstanceCountsDifference')
const inspector = new Session()
inspector.connect()
const rpc = {
  /** @param {string} method @param {object} options */
  async invoke(method, options) {
    return { result: await inspector.post(method, options) }
  },
  dispose() {},
}
const objectGroup = 'owned-duplicate-name-control'
/** @param {string} expression */
const evaluate = async (expression) => inspector.post('Runtime.evaluate', { expression, objectGroup })
/** @param {{ name: string, count: number }[]} counts */
const sorted = (counts) => counts.sort((a, b) => b.count - a.count)
try {
  const { result: objects } = await evaluate(`globalThis.__ownedNameCollisionControl = (() => {
    const First = class OwnedSharedConstructorControl {}
    const Second = class OwnedSharedConstructorControl {}
    return [new First(), new Second(), new Second(), new Second()]
  })()`)
  // Exercise real remote constructor grouping/array conversion on owned native
  // objects, independent of GetInstances' separate optional-DOM-global defect.
  const sample = async () => sorted(await getInstanceCountArray(rpc, objectGroup, await getInstanceCountMap(rpc, objectGroup, objects)))
  const before = await sample()
  const after = await sample()
  assert.deepEqual(before, after)
  const differences = await compareInstanceCountsDifference(before, after)
  assert.deepEqual(differences, [])
  console.log(JSON.stringify({ counts: before.map((item) => item.count), differences }))
} finally {
  await evaluate('delete globalThis.__ownedNameCollisionControl')
  await inspector.post('Runtime.releaseObjectGroup', { objectGroup })
  inspector.disconnect()
}
