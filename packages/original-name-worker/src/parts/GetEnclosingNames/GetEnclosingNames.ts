import type { NodePath } from '@babel/traverse'
import { isLocationInside } from '../IsLocationInside/IsLocationInside.ts'

const LOCATION_UNKNOWN: string = 'unknown'

export const getEnclosingNames = (path: NodePath, position: { line: number; column: number }): string => {
  let current: NodePath | null = path

  // Walk up the parent path until we find a relevant enclosing construct
  while (current) {
    const { node } = current
    if (!isLocationInside(node, position.line, position.column)) {
      current = current.parentPath
      continue
    }

    // Check for class methods (including constructor)
    if (current.isClassMethod() || current.isClassPrivateMethod()) {
      const methodNode = current.node
      const { key } = methodNode

      if (key && key.type === 'Identifier') {
        // Special handling for constructor - return just the class name
        if (methodNode.kind === 'constructor') {
          let classPath: NodePath | null = current.parentPath
          while (classPath && !classPath.isClassDeclaration() && !classPath.isClassExpression()) {
            classPath = classPath.parentPath
          }

          if (classPath) {
            const className = getClassName(classPath)
            return className || LOCATION_UNKNOWN
          }
          return LOCATION_UNKNOWN
        }

        const methodName = methodNode.kind === 'get' ? `get ${key.name}` : key.name

        // Find the enclosing class
        let classPath: NodePath | null = current.parentPath
        while (classPath && !classPath.isClassDeclaration() && !classPath.isClassExpression()) {
          classPath = classPath.parentPath
        }

        if (classPath) {
          const className = getClassName(classPath)
          return className ? `${className}.${methodName}` : methodName
        }
        return methodName
      }
    }

    // Check for class properties/fields
    if (current.isClassProperty()) {
      const classFieldNode = current.node
      if (classFieldNode.key && classFieldNode.key.type === 'Identifier') {
        const fieldName = classFieldNode.key.name

        // Find the enclosing class
        let classPath: NodePath | null = current.parentPath
        while (classPath && !classPath.isClassDeclaration() && !classPath.isClassExpression()) {
          classPath = classPath.parentPath
        }

        if (classPath) {
          const className = getClassName(classPath)
          return className ? `${className}.${fieldName}` : fieldName
        }
        return fieldName
      }
    }

    // Check for class declarations/expressions
    if (current.isClassDeclaration() || current.isClassExpression()) {
      const className = getClassName(current)
      if (className) {
        return className
      }
    }

    // Check for function declarations
    if (current.isFunctionDeclaration()) {
      const { id } = current.node
      if (id && id.name) {
        return id.name
      }
    }

    // Check for function expressions and arrow functions
    if (current.isFunctionExpression() || current.isArrowFunctionExpression()) {
      const functionName = getFunctionName(current)
      if (functionName) {
        return functionName
      }
    }

    current = current.parentPath
  }

  return LOCATION_UNKNOWN
}

const getClassName = (classPath: NodePath): string | undefined => {
  const cls = classPath.node

  if (classPath.isClassDeclaration()) {
    if ('id' in cls && cls.id && typeof cls.id === 'object' && 'name' in cls.id && typeof cls.id.name === 'string') {
      // Handle the special case where we added "AnonymousClass" for "class extends" syntax
      if (cls.id.name === 'AnonymousClass' && 'superClass' in cls && cls.superClass) {
        const superName = cls.superClass && typeof cls.superClass === 'object' && 'type' in cls.superClass && cls.superClass.type === 'Identifier' && 'name' in cls.superClass && typeof cls.superClass.name === 'string' ? cls.superClass.name : 'unknown'
        return `class extends ${superName}`
      }
      return cls.id.name
    }
  }

  if (classPath.isClassExpression()) {
    // Look for variable declarator in the parent chain
    let parent: NodePath | null = classPath.parentPath
    while (parent) {
      if (parent.isVariableDeclarator()) {
        const idNode = parent.node.id
        if (idNode && idNode.type === 'Identifier') {
          return idNode.name
        }
        break
      }
      parent = parent.parentPath
    }
  }

  return undefined
}

const getFunctionName = (functionPath: NodePath): string | undefined => {
  const parent = functionPath.parentPath

  if (parent && parent.isVariableDeclarator()) {
    const idNode = parent.node.id
    if (idNode && idNode.type === 'Identifier') {
      return idNode.name
    }
  }

  if (parent && parent.isAssignmentExpression()) {
    const leftNode = parent.node.left
    if (leftNode && leftNode.type === 'MemberExpression') {
      const { object } = leftNode
      const { property } = leftNode
      if (object && object.type === 'MemberExpression') {
        const objectName = object.object.type === 'Identifier' ? object.object.name : undefined
        const propName = property && property.type === 'Identifier' ? property.name : undefined
        const protoProp = object.property
        if (objectName && protoProp && protoProp.type === 'Identifier' && protoProp.name === 'prototype' && propName) {
          return `${objectName}.${propName}`
        }
      }
    }
  }

  return undefined
}
