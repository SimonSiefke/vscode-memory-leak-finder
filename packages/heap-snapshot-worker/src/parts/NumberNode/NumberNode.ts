import { Node } from '../Node/Node.ts'

export interface NumberNode extends Node {
  readonly value: number
  readonly type: 'number'
}
