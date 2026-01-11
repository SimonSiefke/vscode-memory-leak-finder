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
  readonly id: number
  readonly name?: string | null
  readonly type: AstNodeType
}

export interface NumberNode extends BaseAstNode {
  readonly type: 'number'
  readonly value: number | string
}

export interface StringNode extends BaseAstNode {
  readonly type: 'string'
  readonly value: string
}

export interface BigIntNode extends BaseAstNode {
  readonly type: 'bigint'
  readonly value: string
}

export interface BooleanNode extends BaseAstNode {
  readonly type: 'boolean'
  readonly value: boolean
}

export interface UndefinedNode extends BaseAstNode {
  readonly type: 'undefined'
}

export interface PropertyEntry {
  readonly id: number
  readonly name: string
  readonly value: AstNode
}

export interface ObjectNode extends BaseAstNode {
  readonly properties: readonly PropertyEntry[]
  readonly type: 'object'
}

export interface ArrayNode extends BaseAstNode {
  readonly elements: readonly AstNode[]
  readonly type: 'array'
}

export interface MapEntry {
  readonly key: AstNode
  readonly value: AstNode
}

export interface MapNode extends BaseAstNode {
  readonly entries: readonly MapEntry[]
  readonly type: 'map' | 'weakmap'
}

export interface SetNode extends BaseAstNode {
  readonly elements: readonly AstNode[]
  readonly type: 'set' | 'weakset'
}

export interface CodeNode extends BaseAstNode {
  readonly column?: number
  readonly line?: number
  readonly scriptId?: number
  readonly type: 'code' | 'closure'
  readonly value?: string
}

export interface UnknownNode extends BaseAstNode {
  readonly type: 'unknown'
  readonly value?: string
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
