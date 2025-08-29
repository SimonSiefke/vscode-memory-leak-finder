import type { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'

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
      const methodNode = current.node as t.ClassMethod | t.ClassPrivateMethod
      if (methodNode.kind === 'constructor') {
        // ignore constructor
      } else {
        const key = methodNode.key
        if (key && key.type === 'Identifier') {
          memberName = memberName || key.name
        } else if (key && key.type === 'StringLiteral') {
          memberName = memberName || key.value
        }
      }
    } else if (
      // support both modern PropertyDefinition and older ClassProperty nodes
      ('isPropertyDefinition' in current &&
        typeof (current as unknown as { isPropertyDefinition?: () => boolean }).isPropertyDefinition === 'function' &&
        (current as unknown as { isPropertyDefinition: () => boolean }).isPropertyDefinition()) ||
      ('isClassProperty' in current &&
        typeof (current as unknown as { isClassProperty?: () => boolean }).isClassProperty === 'function' &&
        (current as unknown as { isClassProperty: () => boolean }).isClassProperty())
    ) {
      const classFieldNode = current.node as t.PropertyDefinition | t.ClassProperty
      if (classFieldNode.key && classFieldNode.key.type === 'Identifier') {
        memberName = memberName || classFieldNode.key.name
      }
    } else if (current.isClassDeclaration() || current.isClassExpression()) {
      const cls = current.node as t.ClassDeclaration | t.ClassExpression
      const id = cls.id
      if (id && id.name) {
        className = className || id.name
      } else if (cls.superClass && cls.id == null) {
        const superName: string = cls.superClass && cls.superClass.type === 'Identifier' ? cls.superClass.name : 'unknown'
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
        const idNode = parent.node.id
        if (idNode && idNode.type === 'Identifier' && !functionName) {
          functionName = idNode.name
        }
      } else if (parent && parent.isAssignmentExpression()) {
        const leftNode = parent.node.left
        if (leftNode && leftNode.type === 'MemberExpression') {
          const object = leftNode.object
          const property = leftNode.property
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
