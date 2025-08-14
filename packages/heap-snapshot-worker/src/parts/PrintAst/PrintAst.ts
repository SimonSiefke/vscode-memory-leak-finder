import type {
  ArrayNode,
  AstNode,
  BooleanNode,
  CodeNode,
  MapNode,
  NumberNode,
  ObjectNode,
  SetNode,
  StringNode,
  UndefinedNode,
  UnknownNode,
} from '../AstNode/AstNode.ts'
import type { PrintedValue } from '../PrintedValue/PrintedValue.ts'

const printNumber = (node: NumberNode): PrintedValue => {
  return typeof node.value === 'number' ? node.value : Number(node.value)
}

const printString = (node: StringNode): PrintedValue => {
  return node.value
}

const printBoolean = (node: BooleanNode): PrintedValue => {
  return node.value
}

const printUndefined = (_node: UndefinedNode): PrintedValue => {
  return undefined
}

const printUnknown = (node: UnknownNode): PrintedValue => {
  return node.value ?? `[unknown ${node.id}]`
}

const printCodeLike = (node: CodeNode): PrintedValue => {
  if (typeof node.scriptId === 'number' && typeof node.line === 'number' && typeof node.column === 'number') {
    return `[function: ${node.scriptId}:${node.line}:${node.column}]`
  }
  return `[${node.type} ${node.id}]`
}

const printArray = (node: ArrayNode): PrintedValue => {
  return node.elements.map((el) => printAst(el))
}

const printMapLike = (node: MapNode): PrintedValue => {
  // Prefer array of entries: [{key, value}]
  return node.entries.map((entry) => ({ key: printAst(entry.key), value: printAst(entry.value) }))
}

const printSetLike = (node: SetNode): PrintedValue => {
  return node.elements.map((el) => printAst(el))
}

const printObject = (node: ObjectNode): PrintedValue => {
  const out: Record<string, PrintedValue> = {}
  for (const prop of node.properties) {
    if (!prop.name) continue
    out[prop.name] = printAst(prop.value)
  }
  // If the object node has a name (e.g., from example {abc: {x: 123}}) caller can wrap it
  return out
}

export const printAst = (node: AstNode): PrintedValue => {
  switch (node.type) {
    case 'number':
      return printNumber(node as NumberNode)
    case 'string':
      return printString(node as StringNode)
    case 'boolean':
      return printBoolean(node as BooleanNode)
    case 'undefined':
      return printUndefined(node as UndefinedNode)
    case 'object':
      return printObject(node as ObjectNode)
    case 'array':
      return printArray(node as ArrayNode)
    case 'map':
    case 'weakmap':
      return printMapLike(node as MapNode)
    case 'set':
    case 'weakset':
      return printSetLike(node as SetNode)
    case 'code':
    case 'closure':
      return printCodeLike(node as CodeNode)
    case 'bigint':
      // Keep as string representation to avoid BigInt JSON issues
      return (node as any).value as string
    case 'unknown':
    default:
      return printUnknown(node as UnknownNode)
  }
}

export const printAstRoots = (nodes: readonly AstNode[]): readonly PrintedValue[] => {
  return nodes.map((n) => printAst(n))
}
