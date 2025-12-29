import type { Node } from '../Node/Node.ts'

export interface BigIntNode extends Node {
  readonly type: 'number'
  readonly value: string
}
