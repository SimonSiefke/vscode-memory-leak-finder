export type AstNodeType =
  | 'object'
  | 'array'
  | 'map'
  | 'set'
  | 'weakmap'
  | 'weakset'
  | 'number'
  | 'string'
  | 'bigint'
  | 'boolean'
  | 'undefined'
  | 'code'
  | 'closure'
  | 'unknown'

export interface BaseAstNode {
  type: AstNodeType
  id: number
  name?: string | null
}

export interface NumberNode extends BaseAstNode {
  type: 'number'
  value: number | string
}

export interface StringNode extends BaseAstNode {
  type: 'string'
  value: string
}

export interface BigIntNode extends BaseAstNode {
  type: 'bigint'
  value: string
}

export interface BooleanNode extends BaseAstNode {
  type: 'boolean'
  value: boolean
}

export interface UndefinedNode extends BaseAstNode {
  type: 'undefined'
}

export interface PropertyEntry {
  id: number
  name: string
  value: AstNode
}

export interface ObjectNode extends BaseAstNode {
  type: 'object'
  properties: PropertyEntry[]
  // Optional: approximate closure source locations that capture this object
  closureLocations?: readonly { scriptId: number; line: number; column: number }[]
}

export interface ArrayNode extends BaseAstNode {
  type: 'array'
  elements: AstNode[]
}

export interface MapEntry {
  key: AstNode
  value: AstNode
}

export interface MapNode extends BaseAstNode {
  type: 'map' | 'weakmap'
  entries: MapEntry[]
}

export interface SetNode extends BaseAstNode {
  type: 'set' | 'weakset'
  elements: AstNode[]
}

export interface CodeNode extends BaseAstNode {
  type: 'code' | 'closure'
  value?: string
  scriptId?: number
  line?: number
  column?: number
}

export interface UnknownNode extends BaseAstNode {
  type: 'unknown'
  value?: string
}

export type AstNode =
  | NumberNode
  | StringNode
  | BigIntNode
  | BooleanNode
  | UndefinedNode
  | ObjectNode
  | ArrayNode
  | MapNode
  | SetNode
  | CodeNode
  | UnknownNode
