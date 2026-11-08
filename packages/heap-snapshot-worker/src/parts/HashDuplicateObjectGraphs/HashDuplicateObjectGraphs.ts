import { createHash } from 'node:crypto'
import type { DuplicateObjectGraphNodes } from '../GetDuplicateObjectGraphNodes/GetDuplicateObjectGraphNodes.ts'

/** Hash acyclic dependencies once, then refine the cyclic remainder a fixed number of times. */
export const hashDuplicateObjectGraphs = ({ objects, objectIndex, leaf, id }: DuplicateObjectGraphNodes): readonly string[] => {
  const count = objects.length
  const pending = new Uint32Array(count)
  const parentCounts = new Uint32Array(count)
  for (let index = 0; index < count; index++) {
    for (const property of objects[index].properties) {
      const child = objectIndex[property.target]
      if (child >= 0) {
        pending[index]++
        parentCounts[child]++
      }
    }
  }
  const parentStarts = new Uint32Array(count + 1)
  for (let index = 0; index < count; index++) parentStarts[index + 1] = parentStarts[index] + parentCounts[index]
  const parents = new Uint32Array(parentStarts[count])
  const cursors = parentStarts.slice(0, count)
  for (let index = 0; index < count; index++) {
    for (const property of objects[index].properties) {
      const child = objectIndex[property.target]
      if (child >= 0) parents[cursors[child]++] = index
    }
  }
  const fingerprint = (index: number, hashes: readonly string[]) => {
    const object = objects[index]
    const hash = createHash('sha256').update(JSON.stringify(['Object', id(object.prototype)]))
    for (const property of object.properties) {
      const child = objectIndex[property.target]
      hash.update(JSON.stringify([property.key, child >= 0 ? ['object', hashes[child]] : ['leaf', leaf(property.target)]]))
    }
    return hash.digest('hex')
  }
  let hashes = new Array<string>(count).fill('cycle')
  const queue: number[] = []
  for (let index = 0; index < count; index++) if (pending[index] === 0) queue.push(index)
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const index = queue[cursor]
    hashes[index] = fingerprint(index, hashes)
    for (let parent = parentStarts[index]; parent < parentStarts[index + 1]; parent++) {
      if (--pending[parents[parent]] === 0) queue.push(parents[parent])
    }
  }
  // A fixed bound prevents long cycles from causing unbounded refinement. Hash
  // equality is only a candidate filter; exact graph verification follows.
  for (let round = 0; round < 8; round++) {
    const next = hashes.slice()
    for (let index = 0; index < count; index++) if (pending[index] > 0) next[index] = fingerprint(index, hashes)
    hashes = next
  }
  return hashes
}
