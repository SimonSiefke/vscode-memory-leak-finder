import { parse } from '@babel/parser'
import traverseModule, { NodePath } from '@babel/traverse'
import type * as t from '@babel/types'

const LOCATION_UNKNOWN: string = 'unknown'

const isLocationInside = (node: t.Node, line: number, column: number): boolean => {
  if (!node.loc) {
    return false
  }
  const startLine: number = node.loc.start.line - 1
  const endLine: number = node.loc.end.line - 1
  if (line < startLine) {
    return false
  }
  if (line > endLine) {
    return false
  }
  if (line === startLine && node.loc.start.column > column) {
    return false
  }
  if (line === endLine && node.loc.end.column < column) {
    return false
  }
  return true
}

const getEnclosingNames = (path: NodePath, position: { line: number; column: number }): string => {
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
      // ignore constructor
      if ((nodeAny.kind as string) === 'constructor') {
        // do not set memberName for constructor to keep legacy behavior
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

export const getOriginalClassName = (sourceContent: string, originalLine: number, originalColumn: number): string => {
  if (!sourceContent) {
    return LOCATION_UNKNOWN
  }

  let ast: t.File
  try {
    ast = parse(sourceContent, {
      sourceType: 'unambiguous',
      plugins: ['classProperties', 'classPrivateProperties', 'classPrivateMethods', 'decorators-legacy', 'jsx', 'typescript'],
      ranges: false,
      errorRecovery: true,
      tokens: false,
    }) as unknown as t.File
  } catch {
    return LOCATION_UNKNOWN
  }

  const traverse: any = (traverseModule as any).default || (traverseModule as any)
  let bestPath: NodePath | null = null
  traverse(ast as any, {
    enter(path: NodePath) {
      const node: t.Node = path.node
      if (!node.loc) {
        return
      }
      if (isLocationInside(node, originalLine, originalColumn)) {
        if (!bestPath) {
          bestPath = path
        } else {
          // prefer the deepest node (later visit with smaller range)
          const prev = bestPath.node.loc!
          const curr = node.loc
          const prevRange = (prev.end.line - prev.start.line) * 1000 + (prev.end.column - prev.start.column)
          const currRange = (curr.end.line - curr.start.line) * 1000 + (curr.end.column - curr.start.column)
          if (currRange <= prevRange) {
            bestPath = path
          }
        }
      }
    },
  })

  if (!bestPath) {
    // Fallback to lightweight regex scanning for legacy/invalid syntax like `class extends Base` in statement position
    const fallback: string = fallbackScan(sourceContent, originalLine)
    return fallback
  }

  const name: string = getEnclosingNames(bestPath, { line: originalLine, column: originalColumn })
  if (name && name !== LOCATION_UNKNOWN) {
    return name
  }
  const fallback: string = fallbackScan(sourceContent, originalLine)
  return fallback
}

const fallbackScan = (sourceContent: string, originalLine: number): string => {
  const RE_CLASSNAME: RegExp = /^[a-zA-Z\d]+/
  const classPrefix: string = 'class '
  const extendsPrefix: string = 'extends'
  const lines: string[] = sourceContent.split('\n')
  for (let i = originalLine; i >= 0; i--) {
    const line: string = lines[i]
    const classIndex: number = line.indexOf(classPrefix)
    if (classIndex !== -1) {
      const rest: string = line.slice(classIndex + classPrefix.length)
      const match: RegExpMatchArray | null = rest.match(RE_CLASSNAME)
      if (match) {
        const originalClassName: string = match[0]
        if (originalClassName === extendsPrefix) {
          const other: string = rest.slice(extendsPrefix.length + 1)
          const otherMatch: RegExpMatchArray | null = other.match(RE_CLASSNAME)
          if (otherMatch) {
            return `class extends ` + otherMatch[0]
          }
        }
        return originalClassName
      }
    }
  }
  const anyMatch: RegExpMatchArray | null = sourceContent.match(/class\s+extends\s+([A-Za-z\d]+)/)
  if (anyMatch && anyMatch[1]) {
    return `class extends ${anyMatch[1]}`
  }
  return LOCATION_UNKNOWN
}
