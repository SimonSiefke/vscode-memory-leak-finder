import { Parser, type Node as AcornNode, type Position } from 'acorn'
import { createHash } from 'node:crypto'
import { analyze, type Scope, type Variable } from 'eslint-scope'
import type { FileAnalysis, FunctionFingerprint, SourceMapReference } from '../DuplicateCode/DuplicateCode.ts'

// Acorn's base type omits the fields specific to each ESTree node kind.
type Node = AcornNode & Record<string, any>

const ignoredKeys = new Set(['start', 'end', 'range', 'loc', 'raw', 'shorthand'])
const isNode = (value: unknown): value is Node => !!value && typeof value === 'object' && 'type' in value
const isFunction = (node: Node): boolean =>
  node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'

interface NodeFinisher {
  finishNode(node: Node, type: string): Node
  finishNodeAt(node: Node, type: string, position: number, location?: Position): Node
}

// eslint-scope needs ranges only for identifiers and function bodies. Giving every
// AST node a separate range array costs hundreds of MB on a workbench bundle.
const withRequiredRanges = (node: Node): Node => {
  if (node.type === 'Identifier') node.range = [node.start, node.end]
  if (isFunction(node)) node.body.range = [node.body.start, node.body.end]
  return node
}
const ScopeParser = Parser.extend((Base) => {
  const prototype = Base.prototype as unknown as NodeFinisher
  return class extends Base {
    finishNode(node: Node, type: string): Node {
      return withRequiredRanges(prototype.finishNode.call(this, node, type))
    }
    finishNodeAt(node: Node, type: string, position: number, location?: Position): Node {
      return withRequiredRanges(prototype.finishNodeAt.call(this, node, type, position, location))
    }
  }
})

// Acorn deliberately retains no tokens, comments, parent pointers or per-node locations.
const children = (node: Node): Node[] => {
  const result: Node[] = []
  for (const key of Object.keys(node)) {
    if (ignoredKeys.has(key)) continue
    const value = node[key]
    if (isNode(value)) result.push(value)
    else if (Array.isArray(value)) {
      for (const item of value) if (isNode(item)) result.push(item)
    }
  }
  return result
}

interface Binding {
  readonly id: number
  readonly start: number
  readonly end: number
}

interface Environment {
  readonly upper: Environment | undefined
  readonly variables: Map<string, Binding>
  readonly dynamic: boolean
}

// Analyze only one function's own statements at a time. Retaining eslint-scope's
// references/through arrays for an entire workbench bundle can exhaust the heap.
const resolveBindings = (ast: Node, sourceType: 'script' | 'module') => {
  const bindings = new WeakMap<Node, Binding>()
  const modes = new WeakMap<Node, { strict: boolean; dynamic: boolean }>()
  let nextId = 0
  const tasks: { node: Node; outer?: Environment; strict: boolean }[] = [{ node: ast, strict: sourceType === 'module' }]
  while (tasks.length) {
    const { node, outer, strict } = tasks.pop()!
    const nested: { node: Node; body: Node; params: Node[] }[] = []
    const pending = children(node)
    while (pending.length) {
      const current = pending.pop()!
      if (isFunction(current)) {
        nested.push({ node: current, body: current.body, params: current.params })
        current.body = {
          type: 'BlockStatement',
          body: [],
          start: current.body.start,
          end: current.body.end,
          range: [current.body.start, current.body.end],
        }
        current.params = []
      } else {
        for (const child of children(current)) pending.push(child)
      }
    }
    const region = node.type === 'Program' ? node : { type: 'Program', body: [node], sourceType, range: [node.start, node.end] }
    let manager: ReturnType<typeof analyze>
    try {
      manager = analyze(region, { ecmaVersion: 2024, sourceType, optimistic: true, impliedStrict: strict })
    } finally {
      for (const saved of nested) {
        saved.node.body = saved.body
        saved.node.params = saved.params
      }
    }
    const variables = new Map<Variable, Binding>()
    const environments = new Map<Scope, Environment>()
    for (const scope of manager.scopes) {
      const upper = scope.upper ? environments.get(scope.upper) : outer
      const environment: Environment = {
        upper,
        variables: new Map(),
        dynamic: Boolean(
          upper?.dynamic || scope.type === 'with' || (scope as Scope & { directCallToEvalScope: boolean }).directCallToEvalScope,
        ),
      }
      environments.set(scope, environment)
      for (const variable of scope.variables) {
        const block = scope.block as unknown as Node
        let binding: Binding | undefined
        for (const identifier of variable.identifiers) binding ||= bindings.get(identifier as unknown as Node)
        binding ||= { id: nextId++, start: block.start, end: block.end }
        variables.set(variable, binding)
        environment.variables.set(variable.name, binding)
        for (const identifier of variable.identifiers) bindings.set(identifier as unknown as Node, binding)
      }
    }
    for (const scope of manager.scopes) {
      for (const reference of scope.references) {
        let binding = reference.resolved ? variables.get(reference.resolved) : undefined
        // Unresolved names may be captures from the function's real enclosing scope.
        if (!binding) {
          for (let environment = outer; environment; environment = environment.upper) {
            binding = environment.variables.get(reference.identifier.name)
            if (binding) break
          }
        }
        if (binding) bindings.set(reference.identifier as unknown as Node, binding)
      }
    }
    if (isFunction(node)) {
      const scope = manager.acquire(node, true)!
      modes.set(node, { strict: scope.isStrict, dynamic: environments.get(scope)!.dynamic })
    }
    for (const saved of nested) {
      let scope = manager.acquire(saved.node, true)!
      const strict = scope.isStrict
      // Skip placeholder scopes belonging to the function itself (including its name scope).
      while (scope.upper && scope.block === saved.node) scope = scope.upper
      const environment = environments.get(scope)!
      tasks.push({ node: saved.node, outer: environment, strict })
    }
  }
  return { bindings, modes }
}

const getPosition = (lineStarts: readonly number[], offset: number): { line: number; column: number } => {
  let low = 0
  let high = lineStarts.length
  while (low + 1 < high) {
    const middle = (low + high) >>> 1
    if (lineStarts[middle] <= offset) low = middle
    else high = middle
  }
  return { line: low + 1, column: offset - lineStarts[low] + 1 }
}

export const findDuplicateFunctions = (source: string, file: string, sourceType: 'script' | 'module' = 'module'): FileAnalysis => {
  let sourceMap: SourceMapReference | undefined
  const ast = ScopeParser.parse(source, {
    ecmaVersion: 'latest',
    sourceType,
    onComment: (_block, text, start, end) => {
      const match = /^[#@]\s*sourceMappingURL=(\S+)\s*$/.exec(text.trim())
      // Inline maps can be enormous. Send only their offsets across the worker boundary.
      if (match) sourceMap = match[1].startsWith('data:') ? { start, end } : { url: match[1] }
    },
  })
  const { bindings, modes } = resolveBindings(ast, sourceType)

  const lineStarts = [0]
  const newline = /\r\n|[\n\r\u2028\u2029]/g
  for (let match = newline.exec(source); match; match = newline.exec(source)) lineStarts.push(match.index + match[0].length)

  const fingerprints: FunctionFingerprint[] = []
  let functions = 0
  let skippedDynamicFunctions = 0
  const pending: { node: Node; parent?: Node; classStart: number; homeObject: string; receiverStart: number; dynamic: boolean }[] = [
    { node: ast, classStart: -1, homeObject: 'global', receiverStart: -1, dynamic: false },
  ]
  while (pending.length) {
    const { node, parent, classStart, homeObject, receiverStart, dynamic } = pending.pop()!
    const inClass = node.type === 'ClassDeclaration' || node.type === 'ClassExpression' ? node.start : classStart
    // A surrounding with statement or direct eval can change lexical name lookup.
    const inDynamicScope = dynamic || node.type === 'WithStatement' || Boolean(modes.get(node)?.dynamic)
    const nextReceiver =
      (isFunction(node) && node.type !== 'ArrowFunctionExpression') || node.type === 'StaticBlock' ? node.start : receiverStart
    for (const child of children(node)) {
      let childHome = homeObject
      let childReceiver = nextReceiver
      // Computed keys run in the enclosing context; only member values gain a
      // new home object. Static and instance members have different prototypes.
      if (child === node.value) {
        if (node.type === 'MethodDefinition' || node.type === 'PropertyDefinition') {
          childHome = `class:${inClass}:${Boolean(node.static)}`
          if (node.type === 'PropertyDefinition') childReceiver = node.start
        } else if (node.type === 'Property' && (node.method || node.kind === 'get' || node.kind === 'set')) {
          childHome = `object:${parent!.start}`
        }
      } else if (node.type === 'StaticBlock') childHome = `class:${inClass}:true`
      pending.push({
        node: child,
        parent: node,
        classStart: inClass,
        homeObject: childHome,
        receiverStart: childReceiver,
        dynamic: inDynamicScope,
      })
    }
    if (!isFunction(node)) continue
    functions++

    const localIds = new Map<Binding, number>()
    let nextLocalId = 0
    const self = new Set<Binding>()
    for (const identifier of [node.id, parent?.type === 'VariableDeclarator' ? parent.id : undefined]) {
      const binding = identifier?.type === 'Identifier' ? bindings.get(identifier) : undefined
      if (binding) {
        self.add(binding)
        localIds.set(binding, -1)
      }
    }
    const hash = createHash('sha256')
    const add = (value: unknown): void => {
      // Delimit every token, including strings, to avoid ambiguous concatenation.
      hash.update(JSON.stringify(value) + '\n')
    }
    const identifier = (current: Node): void => {
      const variable = bindings.get(current)
      if (!variable) {
        add(['global', current.name])
        return
      }
      if (self.has(variable) || (variable.start >= node.start && variable.end <= node.end)) {
        if (!localIds.has(variable)) localIds.set(variable, nextLocalId++)
        add(['local', localIds.get(variable)])
      } else {
        // Keep captures distinct even when two enclosing scopes use the same spelling.
        add(['capture', file, variable.id])
      }
    }

    const body =
      node.body.type === 'BlockStatement' ? node.body : { type: 'BlockStatement', body: [{ type: 'ReturnStatement', argument: node.body }] }
    const root = { type: 'Function', async: node.async, generator: Boolean(node.generator), params: node.params, body }
    const stack: { value: unknown; literalName?: boolean }[] = [{ value: root }]
    let sensitive = false
    let unsafe = inDynamicScope
    while (stack.length) {
      const { value, literalName } = stack.pop()!
      if (Array.isArray(value)) {
        add(['array', value.length])
        for (let index = value.length - 1; index >= 0; index--) stack.push({ value: value[index] })
      } else if (value && typeof value === 'object') {
        const current = value as Node
        if (current.type === 'Identifier') {
          if (literalName) add(['name', current.name])
          else identifier(current)
          if (current.name === 'arguments') sensitive = true
          continue
        }
        if (current.type === 'PrivateIdentifier') add(['privateContext', file, classStart])
        if (current.type === 'Super') add(['superContext', file, homeObject])
        if (current.type === 'ThisExpression' || current.type === 'Super' || current.type === 'MetaProperty') sensitive = true
        if (
          current.type === 'WithStatement' ||
          (current.type === 'CallExpression' && current.callee.type === 'Identifier' && current.callee.name === 'eval')
        )
          unsafe = true
        const keys = Object.keys(current)
          .filter((key) => !ignoredKeys.has(key))
          .sort()
        add(['object', keys])
        for (let index = keys.length - 1; index >= 0; index--) {
          const key = keys[index]
          const literal =
            ((current.type === 'MemberExpression' ||
              current.type === 'Property' ||
              current.type === 'MethodDefinition' ||
              current.type === 'PropertyDefinition') &&
              !current.computed &&
              (key === 'property' || key === 'key')) ||
            current.type === 'MetaProperty' ||
            key === 'label'
          stack.push({ value: current[key], literalName: literal })
        }
      } else if (typeof value === 'bigint') add(['bigint', String(value)])
      else if (typeof value === 'number' && !Number.isFinite(value)) add(['number', String(value)])
      else add(value ?? null)
    }
    if (unsafe) {
      skippedDynamicFunctions++
      continue
    }
    add(['strict', modes.get(node)?.strict ?? false])
    const kind = parent?.type === 'MethodDefinition' || parent?.type === 'Property' ? parent.kind : 'function'
    add(['kind', kind === 'get' || kind === 'set' || kind === 'constructor' ? kind : 'function'])
    // Plain arithmetic arrows and ordinary functions match; lexical receivers never do.
    if (sensitive) {
      add(['receiver', node.type === 'ArrowFunctionExpression' ? 'lexical' : 'dynamic'])
      if (node.type === 'ArrowFunctionExpression') add(['lexicalContext', file, receiverStart])
    }
    const name =
      node.id?.name || (parent?.type === 'VariableDeclarator' ? parent.id.name : parent?.key?.name || parent?.key?.value) || '<anonymous>'
    fingerprints.push({
      hash: hash.digest('hex'),
      occurrence: {
        file,
        name: String(name),
        start: node.start,
        end: node.end,
        ...getPosition(lineStarts, node.start),
        bytes: Buffer.byteLength(source.slice(node.start, node.end)),
      },
    })
  }
  return { file, functions, skippedDynamicFunctions, fingerprints, ...(sourceMap ? { sourceMap } : {}) }
}
