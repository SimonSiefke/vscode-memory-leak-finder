import { Node } from '../Node/Node.ts'

export interface ArrayNode extends Node {
  readonly type: 'array'
  readonly elements: readonly Node[]
}
