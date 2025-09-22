import type { NodePath } from '@babel/traverse'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getEnclosingNames = (path: NodePath, position: { line: number; column: number }): string => {
  let className: string | undefined
  let memberName: string | undefined
  let functionName: string | undefined

  let current: NodePath | null = path
  while (current) {
    const { node } = current
    if (!isLocationInside(node, position.line, position.column)) {
      current = current.parentPath
      continue
    }

    if (current.isClassMethod() || current.isClassPrivateMethod()) {
      const methodNode = current.node
      if (methodNode.kind === 'constructor') {
        // ignore constructor
      } else {
        const { key } = methodNode
        if (key && key.type === 'Identifier') {
          if (methodNode.kind === 'get') {
            memberName = memberName || `get ${key.name}`
          } else {
            memberName = memberName || key.name
          }
        } else if (key && key.type === 'StringLiteral') {
          if (methodNode.kind === 'get') {
            memberName = memberName || `get ${key.value}`
          } else {
            memberName = memberName || key.value
          }
        }
      }
    } else if (current.isClassProperty()) {
      const classFieldNode = current.node
      if (classFieldNode.key && classFieldNode.key.type === 'Identifier') {
        memberName = memberName || classFieldNode.key.name
      }
    } else if (current.isClassDeclaration() || current.isClassExpression()) {
      const cls = current.node
      const { id } = cls

      if (id && id.name) {
        // Handle the special case where we added "AnonymousClass" for "class extends" syntax
        if (id.name === 'AnonymousClass' && cls.superClass) {
          const superName: string = cls.superClass && cls.superClass.type === 'Identifier' ? cls.superClass.name : 'unknown'
          className = className || `class extends ${superName}`
        } else {
          className = className || id.name
        }
      } else if (cls.superClass && cls.id == null) {
        const superName: string = cls.superClass && cls.superClass.type === 'Identifier' ? cls.superClass.name : 'unknown'
        className = className || `class extends ${superName}`
      } else if (current.isClassExpression()) {
        // Look for variable declarator in the parent chain
        let parent: NodePath | null = current.parentPath
        while (parent) {
          if (parent.isVariableDeclarator()) {
            const idNode = parent.node.id
            if (idNode && idNode.type === 'Identifier') {
              className = className || idNode.name
            }
            break
          }
          parent = parent.parentPath
        }
      }
    } else if (current.isFunctionDeclaration()) {
      const { id } = current.node
      if (id && id.name && !functionName) {
        functionName = id.name
      }
    } else if (current.isFunctionExpression() || current.isArrowFunctionExpression()) {
      const parent = current.parentPath
      if (parent && parent.isVariableDeclarator()) {
        const idNode = parent.node.id
        if (idNode && idNode.type === 'Identifier' && !functionName) {
          functionName = idNode.name
        }
      } else if (parent && parent.isAssignmentExpression()) {
        const leftNode = parent.node.left
        if (leftNode && leftNode.type === 'MemberExpression') {
          const { object } = leftNode
          const { property } = leftNode
          if (object && object.type === 'MemberExpression') {
            const objectName: string | undefined = object.object.type === 'Identifier' ? object.object.name : undefined
            const propName: string | undefined = property && property.type === 'Identifier' ? property.name : undefined
            const protoProp = object.property
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
