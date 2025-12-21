import { Node } from '../Node/Node.ts'

export interface BooleanNode extends Node {
  type: 'boolean'
  value: boolean
}
