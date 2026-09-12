import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

interface HeapSnapshot {
  readonly snapshot: {
    readonly meta: {
      readonly edge_fields: readonly string[]
      readonly edge_types: readonly (readonly string[])[]
      readonly node_fields: readonly string[]
      readonly node_types: readonly (readonly string[])[]
    }
  }
  readonly edges: readonly number[]
  readonly nodes: readonly number[]
  readonly strings: readonly string[]
}

interface Options {
  readonly names: readonly string[]
  readonly path: string
  readonly pathsPerName: number
  readonly type: string
}

const parseArgs = (args: readonly string[]): Options => {
  let path = ''
  let pathsPerName = 3
  let type = 'object'
  const names: string[] = []
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]
    if (arg === '--name') {
      names.push(args[++index] || '')
    } else if (arg === '--paths-per-name') {
      pathsPerName = Number.parseInt(args[++index] || '', 10)
    } else if (arg === '--type') {
      type = args[++index] || ''
    } else if (!path) {
      path = arg
    } else {
      throw new Error(`Unexpected argument: ${arg}`)
    }
  }
  if (!path || !type || names.length === 0 || names.some((name) => !name)) {
    throw new Error(
      'Usage: analyze-heap-retainers <snapshot> --name <constructor> [--name <constructor>] [--type <node-type>] [--paths-per-name <count>]',
    )
  }
  if (!Number.isInteger(pathsPerName) || pathsPerName < 1) {
    throw new Error('--paths-per-name must be a positive integer')
  }
  return { names, path, pathsPerName, type }
}

const findOffset = (fields: readonly string[], field: string): number => {
  const offset = fields.indexOf(field)
  if (offset === -1) {
    throw new Error(`Heap snapshot is missing ${field}`)
  }
  return offset
}

const analyze = async ({ names, path, pathsPerName, type: requestedType }: Options): Promise<void> => {
  const snapshot = JSON.parse(await readFile(path, 'utf8')) as HeapSnapshot
  const { edge_fields: edgeFields, edge_types: edgeTypes, node_fields: nodeFields, node_types: nodeTypes } = snapshot.snapshot.meta
  const nodeFieldCount = nodeFields.length
  const edgeFieldCount = edgeFields.length
  const nodeCount = snapshot.nodes.length / nodeFieldCount
  const nameOffset = findOffset(nodeFields, 'name')
  const typeOffset = findOffset(nodeFields, 'type')
  const edgeCountOffset = findOffset(nodeFields, 'edge_count')
  const edgeTypeOffset = findOffset(edgeFields, 'type')
  const edgeNameOffset = findOffset(edgeFields, 'name_or_index')
  const edgeTargetOffset = findOffset(edgeFields, 'to_node')
  const weakEdgeType = edgeTypes[0]?.indexOf('weak') ?? -1
  const requestedNames = new Set(names)
  const targetsByName = new Map<string, number[]>()
  const targets = new Set<number>()

  for (let node = 0; node < nodeCount; node++) {
    const offset = node * nodeFieldCount
    const name = snapshot.strings[snapshot.nodes[offset + nameOffset]] || '(anonymous)'
    const type = nodeTypes[0]?.[snapshot.nodes[offset + typeOffset]] || 'unknown'
    if (!requestedNames.has(name) || type !== requestedType) {
      continue
    }
    const matches = targetsByName.get(name) || []
    if (matches.length < pathsPerName) {
      matches.push(node)
      targetsByName.set(name, matches)
      targets.add(node)
    }
  }

  const edgeStarts = new Uint32Array(nodeCount + 1)
  for (let node = 0; node < nodeCount; node++) {
    edgeStarts[node + 1] = edgeStarts[node] + snapshot.nodes[node * nodeFieldCount + edgeCountOffset]
  }

  const parent = new Int32Array(nodeCount)
  const parentEdge = new Int32Array(nodeCount)
  parent.fill(-1)
  parentEdge.fill(-1)
  parent[0] = 0
  const queue = new Uint32Array(nodeCount)
  queue[0] = 0
  let readIndex = 0
  let writeIndex = 1
  let remaining = targets.size
  while (readIndex < writeIndex && remaining > 0) {
    const source = queue[readIndex++]
    for (let edge = edgeStarts[source]; edge < edgeStarts[source + 1]; edge++) {
      const edgeOffset = edge * edgeFieldCount
      if (snapshot.edges[edgeOffset + edgeTypeOffset] === weakEdgeType) {
        continue
      }
      const target = snapshot.edges[edgeOffset + edgeTargetOffset] / nodeFieldCount
      if (parent[target] !== -1) {
        continue
      }
      parent[target] = source
      parentEdge[target] = edge
      queue[writeIndex++] = target
      if (targets.has(target)) {
        remaining--
      }
    }
  }

  const getNodeLabel = (node: number): string => {
    const offset = node * nodeFieldCount
    const name = snapshot.strings[snapshot.nodes[offset + nameOffset]] || '(anonymous)'
    const type = nodeTypes[0]?.[snapshot.nodes[offset + typeOffset]] || 'unknown'
    return `${type} ${name}`
  }
  const getEdgeLabel = (edge: number): string => {
    const offset = edge * edgeFieldCount
    const type = edgeTypes[0]?.[snapshot.edges[offset + edgeTypeOffset]] || 'unknown'
    const nameOrIndex = snapshot.edges[offset + edgeNameOffset]
    return type === 'element' ? `[${nameOrIndex}]` : snapshot.strings[nameOrIndex] || type
  }

  for (const name of names) {
    const matches = targetsByName.get(name) || []
    console.log(`\n${name}: ${matches.length} path(s)`)
    for (const target of matches) {
      if (parent[target] === -1) {
        console.log(`  ${getNodeLabel(target)} is not strongly reachable`)
        continue
      }
      const pathNodes: number[] = []
      for (let node = target; ; node = parent[node]) {
        pathNodes.push(node)
        if (node === 0) {
          break
        }
      }
      pathNodes.reverse()
      console.log(`  path length ${pathNodes.length - 1}`)
      for (let index = 1; index < pathNodes.length; index++) {
        const source = pathNodes[index - 1]
        const targetNode = pathNodes[index]
        console.log(`    ${getNodeLabel(source)} --${getEdgeLabel(parentEdge[targetNode])}--> ${getNodeLabel(targetNode)}`)
      }
    }
  }
}

const main = async (): Promise<void> => {
  await analyze(parseArgs(process.argv.slice(2)))
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
