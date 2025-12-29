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
  id: number
  name?: string | null
  type: AstNodeType
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
  properties: PropertyEntry[]
  type: 'object'
}

export interface ArrayNode extends BaseAstNode {
  elements: AstNode[]
  type: 'array'
}

export interface MapEntry {
  key: AstNode
  value: AstNode
}

export interface MapNode extends BaseAstNode {
  entries: MapEntry[]
  type: 'map' | 'weakmap'
}

export interface SetNode extends BaseAstNode {
  elements: AstNode[]
  type: 'set' | 'weakset'
}

export interface CodeNode extends BaseAstNode {
  column?: number
  line?: number
  scriptId?: number
  type: 'code' | 'closure'
  value?: string
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
