import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { isLocationInside } from './IsLocationInside.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getEnclosingNames = (path: NodePath, position: { line: number; column: number }): string => {
  let className: string | undefined
  let memberName: string | undefined
  let functionName: string | undefined

  let current: NodePath | null = path
  while (current) {
    const node: t.Node = current.node
    if (!isLocationInside(node, position.line, position.column)) {
      current = current.parentPath
      continue
    }

    if (current.isClassMethod() || current.isClassPrivateMethod()) {
      const nodeAny: any = current.node
      if ((nodeAny.kind as string) === 'constructor') {
        // ignore constructor
      } else {
        const key: any = nodeAny.key
        if (key && key.type === 'Identifier') {
          memberName = memberName || key.name
        } else if (key && key.type === 'StringLiteral') {
          memberName = memberName || key.value
        }
      }
    } else if (
      ((current as any).isPropertyDefinition && (current as any).isPropertyDefinition()) ||
      ((current as any).isClassProperty && (current as any).isClassProperty())
    ) {
      const nodeAny: any = current.node
      if (nodeAny.key && nodeAny.key.type === 'Identifier') {
        memberName = memberName || nodeAny.key.name
      }
    } else if (current.isClassDeclaration() || current.isClassExpression()) {
      const id: any = (current.node as any).id
      if (id && id.name) {
        className = className || id.name
      } else if ((current.node as any).superClass && (current.node as any).id == null) {
        const superName = ((current.node as any).superClass && ((current.node as any).superClass as any).name) || 'unknown'
        className = className || `class extends ${superName}`
      }
    } else if (current.isFunctionDeclaration()) {
      const id = current.node.id
      if (id && id.name && !functionName) {
        functionName = id.name
      }
    } else if (current.isFunctionExpression() || current.isArrowFunctionExpression()) {
      const parent = current.parentPath
      if (parent && parent.isVariableDeclarator()) {
        const id: any = parent.node.id
        if (id && id.type === 'Identifier' && !functionName) {
          functionName = id.name
        }
      } else if (parent && parent.isAssignmentExpression()) {
        const left: any = parent.node.left
        if (left && left.type === 'MemberExpression') {
          const object: any = left.object
          const property: any = left.property
          if (object && object.type === 'MemberExpression') {
            const objectName: string | undefined = (object.object as any)?.name
            const propName: string | undefined = property?.type === 'Identifier' ? property.name : undefined
            const protoProp: any = object.property
            if (objectName && protoProp && protoProp.type === 'Identifier' && protoProp.name === 'prototype' && propName) {
              className = className || objectName
              memberName = memberName || propName
            }
          }
        }
      }
    }

    current = current.parentPath
  }

  if (className && memberName) {
    return `${className}.${memberName}`
  }
  if (functionName) {
    return functionName
  }
  if (className) {
    return className
  }
  return LOCATION_UNKNOWN
}
