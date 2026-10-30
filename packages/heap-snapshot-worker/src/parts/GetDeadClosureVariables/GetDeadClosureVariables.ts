import { getDeadClosureLocations } from '../GetDeadClosureLocations/GetDeadClosureLocations.ts'
import { analyzeContexts } from '../AnalyzeClosureContexts/AnalyzeClosureContexts.ts'
import { HeapSnapshot, type ClosureSnapshotProfile } from '../ClosureContextSnapshot/ClosureContextSnapshot.ts'

// Dominator subtrees can overlap. Index them once so each byte is counted at
// most once, even when multiple variables or closures retain the same object.
const createByteCounter = (snapshot: HeapSnapshot) => {
  const count = snapshot.dominators.length
  const firstChild = new Int32Array(count).fill(-1)
  const nextSibling = new Int32Array(count).fill(-1)
  for (let i = 1; i < count; i++) {
    const parent = snapshot.dominators[i]
    nextSibling[i] = firstChild[parent]
    firstChild[parent] = i
  }
  const start = new Uint32Array(count)
  const end = new Uint32Array(count)
  const stack = count ? [0] : []
  let clock = 0
  while (stack.length) {
    const entry = stack.pop()!
    if (entry < 0) {
      end[~entry] = clock
      continue
    }
    start[entry] = clock++
    stack.push(~entry)
    for (let child = firstChild[entry]; child !== -1; child = nextSibling[child]) stack.push(child)
  }
  return (indexes: number[]) => {
    const ordinals = [...new Set(indexes.map((index) => index / snapshot.nodeFieldCount))].sort((a, b) => start[a] - start[b])
    let until = -1
    let bytes = 0
    for (const ordinal of ordinals) {
      if (start[ordinal] < until) continue
      bytes += snapshot.retainedSizes[ordinal]
      until = end[ordinal]
    }
    return bytes
  }
}

export const getDeadClosureVariables = (profile: ClosureSnapshotProfile, options: { groupClosures?: boolean } = {}) => {
  const meta = profile.snapshot.meta
  const required = [
    [meta.scope_fields, ['script_node_index', 'scope_id', 'depth', 'scope_context_vars_count', 'scope_uses_count']],
    [meta.scope_context_var_fields, ['name']],
    [meta.scope_use_fields, ['declaring_scope_id', 'slot_index']],
  ] as const
  if (
    !profile.scopes ||
    !profile.scope_context_vars ||
    !profile.scope_uses ||
    required.some(([fields, names]) => names.some((name) => !fields?.includes(name)))
  ) {
    throw new Error(
      'dead-closure-variables requires V8 heap snapshots with embedded scope metadata. Update the inspected Chromium/Electron or Node.js runtime.',
    )
  }
  const snapshot = new HeapSnapshot(profile)
  const analysis = analyzeContexts(snapshot)
  const countBytes = createByteCounter(snapshot)
  const contexts = analysis.scopes
    .flatMap((scope) =>
      scope.contexts.map((context) => ({
        contextNodeId: context.contextNodeId,
        scriptName: scope.scriptName,
        scopeName: scope.scopeName,
        scopeStart: scope.scopeStart,
        scopeEnd: scope.scopeEnd,
        deadBytes: countBytes(context.deadFields.map((field) => field.valueNodeIndex)),
        variables: context.deadFields,
      })),
    )
    .sort((a, b) => b.deadBytes - a.deadBytes || a.contextNodeId - b.contextNodeId)
  // Attribute dead fields to closures through their full context chain, including
  // outer scopes. Reference the shared context table instead of serializing all
  // variable details again for each closure retaining the same context.
  const contextsById = new Map(contexts.map((context) => [context.contextNodeId, context]))
  const closures = []
  const locate = getDeadClosureLocations(snapshot)
  const grouped = new Map<string, { source: ReturnType<typeof locate>; name: string; count: number; contextIds: Set<number> }>()
  const closureContexts = new Map<number, { deadBytes: number; contextNodeIds: number[] } | undefined>()
  for (let index = 0; index < snapshot.nodes.length; index += snapshot.nodeFieldCount) {
    const node = snapshot.createNode()
    node.nodeIndex = index
    if (node.rawType() !== snapshot.nodeClosureType) continue
    const firstContext = node.findInternalEdgeTarget('context')
    if (!firstContext) continue
    let attribution = closureContexts.get(firstContext.nodeIndex)
    if (!closureContexts.has(firstContext.nodeIndex)) {
      let context: typeof firstContext | undefined = firstContext
      const seen = new Set<number>()
      const deadContexts: typeof contexts = []
      while (context && snapshot.isContextObject(context) && !seen.has(context.nodeIndex)) {
        seen.add(context.nodeIndex)
        const deadContext = contextsById.get(context.id())
        if (deadContext) deadContexts.push(deadContext)
        context = context.findInternalEdgeTarget('previous')
      }
      attribution = deadContexts.length
        ? {
            deadBytes: countBytes(deadContexts.flatMap((context) => context.variables.map((variable) => variable.valueNodeIndex))),
            contextNodeIds: deadContexts.map((context) => context.contextNodeId),
          }
        : undefined
      closureContexts.set(firstContext.nodeIndex, attribution)
    }
    if (attribution) {
      closures.push({ closureNodeId: node.id(), name: node.name(), ...attribution })
      if (!options.groupClosures) continue
      const source = locate(node)
      const group = grouped.get(source.functionKey) ?? { source, name: node.name(), count: 0, contextIds: new Set<number>() }
      group.count++
      for (const id of attribution.contextNodeIds) group.contextIds.add(id)
      grouped.set(source.functionKey, group)
    }
  }
  closures.sort((a, b) => b.deadBytes - a.deadBytes || a.closureNodeId - b.closureNodeId)
  return {
    deadBytes: countBytes(contexts.flatMap((context) => context.variables.map((variable) => variable.valueNodeIndex))),
    closures,
    closureGroups: [...grouped.values()].map((group) => ({
      ...group.source,
      name: group.name,
      count: group.count,
      deadBytes: countBytes(
        [...group.contextIds].flatMap((id) => contextsById.get(id)!.variables.map((variable) => variable.valueNodeIndex)),
      ),
    })),
    contexts,
    scriptsWithoutScopes: analysis.scriptsWithoutScopes,
  }
}
