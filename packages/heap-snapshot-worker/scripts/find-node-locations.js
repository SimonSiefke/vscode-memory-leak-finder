#!/usr/bin/env node
/*
  Debug utility: Given a Chrome DevTools heap snapshot JSON file and a target node id,
  prints any entries in snapshot.locations that reference a node with that id.

  Usage:
    node scripts/find-node-locations.js <snapshotPath> <targetNodeId> [--outputLocations[=true|false]]
*/

import fs from 'node:fs'
import path from 'node:path'

function readJsonFile(filePath) {
  const resolved = path.resolve(filePath)
  const content = fs.readFileSync(resolved, 'utf8')
  return JSON.parse(content)
}

function getRequiredOffset(fields, name) {
  const idx = fields.indexOf(name)
  if (idx === -1) {
    throw new Error(`snapshot.meta.* does not have field: ${name}`)
  }
  return idx
}

function main() {
  const [, , snapshotPath, targetIdArg, ...restArgs] = process.argv
  if (!snapshotPath || !targetIdArg) {
    console.error('Usage: node scripts/find-node-locations.js <snapshotPath> <targetNodeId> [--outputLocations[=true|false]]')
    process.exit(1)
  }

  const targetNodeId = Number(targetIdArg)
  if (!Number.isFinite(targetNodeId)) {
    console.error('targetNodeId must be a number')
    process.exit(1)
  }

  let outputLocations = false
  for (const arg of restArgs) {
    if (arg === '--outputLocations') {
      outputLocations = true
    } else if (arg.startsWith('--outputLocations=')) {
      const value = arg.split('=')[1]
      outputLocations = value === 'true' || value === '1'
    }
  }

  const snapshot = readJsonFile(snapshotPath)

  const meta = snapshot.snapshot?.meta || snapshot.meta
  if (!meta) {
    throw new Error('Invalid snapshot: missing snapshot.meta')
  }

  const nodeFields = meta.node_fields
  const locationFields = meta.location_fields
  if (!Array.isArray(nodeFields)) {
    throw new Error('Invalid snapshot: meta.node_fields not found')
  }
  if (!Array.isArray(locationFields)) {
    throw new Error('Invalid snapshot: meta.location_fields not found')
  }

  const nodes = snapshot.nodes
  if (!Array.isArray(nodes)) {
    throw new Error('Invalid snapshot: nodes not found (expected array)')
  }

  const strings = snapshot.strings || []
  const locations = snapshot.locations
  if (!Array.isArray(locations)) {
    throw new Error('Invalid snapshot: locations not found (expected array)')
  }

  const nodeFieldCount = nodeFields.length
  const idOffset = getRequiredOffset(nodeFields, 'id')
  const nameOffset = nodeFields.indexOf('name')

  const objectIndexField = locationFields.indexOf('object_index')
  const nodeIndexField = locationFields.indexOf('node_index')
  if (objectIndexField === -1 && nodeIndexField === -1) {
    throw new Error('Invalid snapshot: meta.location_fields missing object_index or node_index')
  }

  const scriptIdField = locationFields.indexOf('script_id')
  const lineField = locationFields.indexOf('line')
  const columnField = locationFields.indexOf('column')

  // Build a set of node start indices whose id equals targetNodeId
  const matchingNodeStartIndices = new Set()
  const matchingNodeOrdinals = new Set()

  const totalNodes = Math.floor(nodes.length / nodeFieldCount)
  for (let ordinal = 0; ordinal < totalNodes; ordinal++) {
    const start = ordinal * nodeFieldCount
    const id = nodes[start + idOffset]
    if (id === targetNodeId) {
      matchingNodeStartIndices.add(start)
      matchingNodeOrdinals.add(ordinal)
    }
  }

  if (matchingNodeStartIndices.size === 0) {
    console.log(`No nodes with id ${targetNodeId} found in snapshot.`)
    process.exit(0)
  }

  function getNodeNameByStartIndex(startIndex) {
    if (nameOffset === -1) {
      return '(no-name-field)'
    }
    const nameStringIndex = nodes[startIndex + nameOffset]
    if (typeof nameStringIndex !== 'number') {
      return '(no-name)'
    }
    return strings[nameStringIndex] || `(name#${nameStringIndex})`
  }

  // Scan locations and collect matches
  const matches = []
  for (let i = 0; i < locations.length; i += locationFields.length) {
    let nodeStartIndex = -1
    let nodeOrdinal = -1

    if (objectIndexField !== -1) {
      const objectIndex = locations[i + objectIndexField]
      // object_index is the index into the flat nodes array at the start of a node
      if (typeof objectIndex === 'number') {
        nodeStartIndex = objectIndex
        nodeOrdinal = Math.floor(objectIndex / nodeFieldCount)
      }
    } else if (nodeIndexField !== -1) {
      const ordinal = locations[i + nodeIndexField]
      if (typeof ordinal === 'number') {
        nodeOrdinal = ordinal
        nodeStartIndex = ordinal * nodeFieldCount
      }
    }

    if (nodeStartIndex === -1 || nodeOrdinal === -1) {
      continue
    }

    if (matchingNodeStartIndices.has(nodeStartIndex) || matchingNodeOrdinals.has(nodeOrdinal)) {
      const scriptId = scriptIdField === -1 ? undefined : locations[i + scriptIdField]
      const line = lineField === -1 ? undefined : locations[i + lineField]
      const column = columnField === -1 ? undefined : locations[i + columnField]
      const name = getNodeNameByStartIndex(nodeStartIndex)
      /** @type {Record<string, unknown>} */
      const entry = { nodeStartIndex, nodeOrdinal, scriptId, line, column, name }
      if (outputLocations && Number.isFinite(scriptId) && Number.isFinite(line) && Number.isFinite(column)) {
        entry.location = `${scriptId}:${line}:${column}`
      }
      matches.push(entry)
    }
  }

  console.log(
    JSON.stringify(
      {
        targetNodeId,
        outputLocations,
        occurrences: matches.length,
        nodesFound: matchingNodeStartIndices.size,
        nodeOrdinals: Array.from(matchingNodeOrdinals).slice(0, 50),
        matches: matches.slice(0, 200),
      },
      null,
      2,
    ),
  )
}

try {
  main()
} catch (error) {
  console.error(String((error && error.stack) || error))
  process.exit(1)
}
