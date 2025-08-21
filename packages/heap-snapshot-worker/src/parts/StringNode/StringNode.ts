import { Node } from '../Node/Node.ts'

export interface StringNode extends Node {
  type: 'string'
  value: string
}
