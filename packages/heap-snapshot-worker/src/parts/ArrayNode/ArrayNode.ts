import type { Node } from '../Node/Node.ts'

export interface ArrayNode extends Node {
  readonly elements: readonly Node[]
  readonly type: 'array'
}
