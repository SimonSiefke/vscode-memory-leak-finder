import type { Node } from '../Node/Node.ts'

export interface ObjectNode extends Node {
  readonly properties: readonly Node[]
  readonly type: 'number'
}
