import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.ts'
import { getObjectWithPropertyNodeIndices3 } from '../src/parts/GetObjectWithPropertyNodeIndices3/GetObjectWithPropertyNodeIndices3.ts'

const beforePath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'
const afterPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/1.json'

const property = 'dispose'

const getIds = (snapshot, indices) => {
  const nodes = snapshot.nodes
  const nodeIdIndex = snapshot.meta.node_fields.indexOf('id')
  const ids = new Uint32Array(indices.length)
  for (let i = 0; i < indices.length; i++) {
    ids[i] = nodes[indices[i] + nodeIdIndex]
  }
  return ids
}

const getAllIds = (snapshot) => {
  const nodes = snapshot.nodes
  const nodeFields = snapshot.meta.node_fields
  const itemsPerNode = nodeFields.length
  const idIndex = nodeFields.indexOf('id')
  const count = nodes.length / itemsPerNode
  const ids = new Uint32Array(count)
  let j = 0
  for (let offset = 0; offset < nodes.length; offset += itemsPerNode) {
    ids[j++] = nodes[offset + idIndex]
  }
  return ids
}

const getNames = (snapshot, indices) => {
  const nodes = snapshot.nodes
  const nodeNameIndex = snapshot.meta.node_fields.indexOf('name')
  const itemsPerNode = snapshot.meta.node_fields.length
  const strings = snapshot.strings
  const names = []
  for (let i = 0; i < indices.length; i++) {
    const offset = indices[i]
    const nameIndex = nodes[offset + nodeNameIndex]
    const name = strings[nameIndex] || ''
    names.push(name)
  }
  return names
}

const toSet = (typed) => {
  const s = new Set()
  for (const v of typed) s.add(v)
  return s
}

const countBy = (arr) => {
  const map = Object.create(null)
  for (const v of arr) {
    map[v] = (map[v] || 0) + 1
  }
  return map
}

const diffCounts = (a, b) => {
  const result = []
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const da = a[k] || 0
    const db = b[k] || 0
    const delta = db - da
    if (delta !== 0) {
      result.push({ key: k, before: da, after: db, delta })
    }
  }
  result.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta))
  return result
}

async function main() {
  const [snapshot1, snapshot2] = await Promise.all([
    prepareHeapSnapshot(beforePath, { parseStrings: true }),
    prepareHeapSnapshot(afterPath, { parseStrings: true }),
  ])

  const indicesBefore = getObjectWithPropertyNodeIndices3(snapshot1, property)
  const indicesAfter = getObjectWithPropertyNodeIndices3(snapshot2, property)
  console.log('candidates', { before: indicesBefore.length, after: indicesAfter.length })

  const idsBefore = getIds(snapshot1, indicesBefore)
  const idsAfter = getIds(snapshot2, indicesAfter)

  const setBefore = toSet(idsBefore)
  let overlap = 0
  for (const id of idsAfter) {
    if (setBefore.has(id)) overlap++
  }
  console.log('idOverlap', { overlap, beforeUnique: setBefore.size, afterCount: idsAfter.length })

  // Overall overlap across all nodes
  const allBefore = getAllIds(snapshot1)
  const allAfter = getAllIds(snapshot2)
  const setAllBefore = toSet(allBefore)
  let overlapAll = 0
  for (const id of allAfter) {
    if (setAllBefore.has(id)) overlapAll++
  }
  console.log('allIdOverlap', {
    overlap: overlapAll,
    beforeUnique: setAllBefore.size,
    afterCount: allAfter.length,
  })

  const namesBefore = getNames(snapshot1, indicesBefore)
  const namesAfter = getNames(snapshot2, indicesAfter)
  const cbBefore = countBy(namesBefore)
  const cbAfter = countBy(namesAfter)
  const deltas = diffCounts(cbBefore, cbAfter).slice(0, 25)
  console.log('topNameDeltas', deltas)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
