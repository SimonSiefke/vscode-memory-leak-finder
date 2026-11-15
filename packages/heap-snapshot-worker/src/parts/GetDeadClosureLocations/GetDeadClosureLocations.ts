import type { HeapSnapshot, HeapSnapshotNode } from '../ClosureContextSnapshot/ClosureContextSnapshot.ts'

export const getDeadClosureLocations = (snapshot: HeapSnapshot) => {
  const { profile } = snapshot
  const fields = profile.snapshot.meta.location_fields
  const stride = fields.length
  const objectOffset = fields.indexOf('object_index')
  const scriptOffset = fields.indexOf('script_id')
  const scriptObjectOffset = fields.indexOf('script_object_index')
  const lineOffset = fields.indexOf('line')
  const columnOffset = fields.indexOf('column')
  const locations = profile.locations ?? []
  const indexes = new Map<number, number>()
  const typeOffset = profile.snapshot.meta.node_fields.indexOf('type')
  if (stride && [objectOffset, scriptOffset, lineOffset, columnOffset].every((offset) => offset >= 0)) {
    for (let index = 0; index < locations.length; index += stride) {
      const nodeIndex = locations[index + objectOffset]
      if (snapshot.nodes[nodeIndex + typeOffset] === snapshot.nodeClosureType) indexes.set(nodeIndex, index)
    }
  }
  const scripts = new Map<number, { url: string; scriptId: number }>()
  const getScript = (script: HeapSnapshotNode) => {
    let info = scripts.get(script.nodeIndex)
    if (!info) {
      const prefix = 'system / Script / '
      const name = script.rawName()
      info = {
        url: name.startsWith(prefix) ? name.slice(prefix.length) : (script.findInternalEdgeTarget('source_url')?.name() ?? ''),
        scriptId: script.findInternalEdgeTarget('id')?.nodeValueAsInt() ?? -1,
      }
      scripts.set(script.nodeIndex, info)
    }
    return info
  }
  return (node: HeapSnapshotNode) => {
    const index = indexes.get(node.nodeIndex)
    const shared = node.findInternalEdgeTarget('shared')
    let script: HeapSnapshotNode | undefined
    if (index !== undefined && scriptObjectOffset >= 0) {
      script = snapshot.createNode()
      script.nodeIndex = locations[index + scriptObjectOffset]
    } else {
      script = shared?.findInternalEdgeTarget('script')
    }
    const info = script ? getScript(script) : undefined
    const scriptId = index === undefined ? (info?.scriptId ?? -1) : locations[index + scriptOffset]
    const line = index === undefined ? -1 : locations[index + lineOffset]
    const column = index === undefined ? -1 : locations[index + columnOffset]
    const url = info?.url ?? ''
    const scopeId = index === undefined ? shared?.findInternalEdgeTarget('scope_id')?.nodeValueAsInt() : undefined
    return {
      scriptId,
      line,
      column,
      url,
      sourceLocation: url && line >= 0 ? `${url}:${line}:${column}` : undefined,
      functionKey:
        line >= 0
          ? JSON.stringify([url || scriptId, line, column, node.name()])
          : scopeId !== undefined
            ? JSON.stringify([url || scriptId, scopeId, node.name()])
            : `node:${node.id()}`,
    }
  }
}
