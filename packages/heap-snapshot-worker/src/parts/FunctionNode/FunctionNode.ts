import { Node } from '../Node/Node.ts'

export interface CodeNode extends Node {
  type: 'code' | 'closure'
  value?: string
}
