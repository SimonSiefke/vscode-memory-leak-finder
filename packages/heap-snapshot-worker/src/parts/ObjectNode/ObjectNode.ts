import { Node } from '../Node/Node.ts'

export interface ObjectNode extends Node {
  readonly type: 'number'
  readonly properties: readonly Node[]
}
