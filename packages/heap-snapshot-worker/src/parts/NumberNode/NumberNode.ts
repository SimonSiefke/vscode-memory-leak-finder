import type { Node } from '../Node/Node.ts'

export interface NumberNode extends Node {
  readonly type: 'number'
  readonly value: number
}
