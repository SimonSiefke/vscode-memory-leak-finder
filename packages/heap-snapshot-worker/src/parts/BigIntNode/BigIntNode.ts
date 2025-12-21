import { Node } from '../Node/Node.ts'

export interface BigIntNode extends Node {
  readonly value: string
  readonly type: 'number'
}
