import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateEverythingWrapperPluginOptions {
  readonly scriptId?: number | string
}

const helperName = '__vscodeMemoryLeakFinderTrackEverything'
const createHelper = (): t.MemberExpression => t.memberExpression(t.identifier('globalThis'), t.identifier(helperName))

const getLocationNodes = (node: t.Node, scriptIdNode: t.Expression): readonly t.Expression[] => {
  return [
    scriptIdNode,
    t.numericLiteral(node.loc?.start.line ?? -1),
    t.numericLiteral(node.loc?.start.column ?? -1),
  ]
}

const getCalleeName = (node: t.Expression | t.V8IntrinsicIdentifier): string => {
  if (t.isIdentifier(node)) {
    return node.name
  }
  if (t.isMemberExpression(node) && t.isIdentifier(node.property)) {
    return node.property.name
  }
  return 'Instance'
}

const isGeneratedHelperCall = (node: t.CallExpression | t.OptionalCallExpression): boolean => {
  return (
    t.isMemberExpression(node.callee) &&
    t.isIdentifier(node.callee.object, { name: 'globalThis' }) &&
    t.isIdentifier(node.callee.property, { name: helperName })
  )
}

const shouldTrackLiteral = (path: NodePath<t.Expression>): boolean => {
  const parent = path.parentPath
  if (!parent) {
    return true
  }
  if (parent.isExpressionStatement() && Boolean((parent.node as t.ExpressionStatement & { directive?: string }).directive)) {
    return false
  }
  if (
    (parent.isObjectProperty() || parent.isObjectMethod() || parent.isClassProperty() || parent.isClassMethod()) &&
    parent.node.key === path.node &&
    !parent.node.computed
  ) {
    return false
  }
  if (parent.isMemberExpression() && parent.node.property === path.node && !parent.node.computed) {
    return false
  }
  return !(
    parent.isImportDeclaration() ||
    parent.isExportAllDeclaration() ||
    parent.isExportNamedDeclaration() ||
    parent.isImportAttribute()
  )
}

const getMethodLocations = (node: t.ObjectExpression | t.ClassExpression | t.ClassDeclaration): t.ArrayExpression => {
  const methods: t.Node[] = t.isObjectExpression(node)
    ? node.properties.filter((property) => t.isObjectMethod(property))
    : node.body.body.filter(
        (element) =>
          (t.isClassMethod(element) || t.isClassPrivateMethod(element)) &&
          !(t.isClassMethod(element) && element.kind === 'constructor'),
      )
  return t.arrayExpression(
    methods.map((method) =>
      t.arrayExpression([
        t.numericLiteral(method.loc?.start.line ?? -1),
        t.numericLiteral(method.loc?.start.column ?? -1),
      ]),
    ),
  )
}

export const createEverythingWrapperPlugin = (options: CreateEverythingWrapperPluginOptions): Visitor => {
  const { scriptId = 123 } = options
  const scriptIdNode = typeof scriptId === 'number' ? t.numericLiteral(scriptId) : t.stringLiteral(scriptId)

  const wrap = (
    path: NodePath<t.Expression>,
    hint: string,
    identityMode: 'created' | 'observed' = 'created',
    methodLocations: t.ArrayExpression = t.arrayExpression(),
  ): void => {
    const node = path.node
    const wrapped = t.callExpression(createHelper(), [
      node,
      ...getLocationNodes(node, scriptIdNode),
      t.stringLiteral(hint),
      t.stringLiteral(identityMode),
      methodLocations,
    ])
    path.replaceWith(wrapped)
    path.skip()
  }

  const registerDeclaration = (path: NodePath<t.FunctionDeclaration | t.ClassDeclaration>, hint: string): void => {
    const { id } = path.node
    const { node } = path
    if (!id) {
      return
    }
    const methods = t.isClassDeclaration(node) ? getMethodLocations(node) : t.arrayExpression()
    const call = t.expressionStatement(
      t.callExpression(createHelper(), [
        t.identifier(id.name),
        ...getLocationNodes(node, scriptIdNode),
        t.stringLiteral(hint),
        t.stringLiteral('created'),
        methods,
      ]),
    )
    path.insertAfter(call)
  }

  const literalExit = (path: NodePath<t.Expression>, hint: string): void => {
    if (shouldTrackLiteral(path)) {
      wrap(path, hint)
    }
  }

  return {
    ArrayExpression: { exit: (path: NodePath<t.ArrayExpression>) => wrap(path, 'Array') },
    ArrowFunctionExpression: { exit: (path: NodePath<t.ArrowFunctionExpression>) => wrap(path, 'Function') },
    BigIntLiteral: { exit: (path: NodePath<t.BigIntLiteral>) => literalExit(path, 'BigInt') },
    BinaryExpression: { exit: (path: NodePath<t.BinaryExpression>) => wrap(path, 'Dynamic') },
    BooleanLiteral: { exit: (path: NodePath<t.BooleanLiteral>) => literalExit(path, 'Boolean') },
    CallExpression: {
      exit: (path: NodePath<t.CallExpression>) => {
        if (!isGeneratedHelperCall(path.node)) {
          wrap(path, 'Dynamic', 'observed')
        }
      },
    },
    ClassDeclaration: { exit: (path: NodePath<t.ClassDeclaration>) => registerDeclaration(path, 'Class') },
    ClassExpression: {
      exit: (path: NodePath<t.ClassExpression>) => wrap(path, 'Class', 'created', getMethodLocations(path.node)),
    },
    FunctionDeclaration: { exit: (path: NodePath<t.FunctionDeclaration>) => registerDeclaration(path, 'Function') },
    FunctionExpression: { exit: (path: NodePath<t.FunctionExpression>) => wrap(path, 'Function') },
    NewExpression: {
      exit: (path: NodePath<t.NewExpression>) => wrap(path, getCalleeName(path.node.callee)),
    },
    NullLiteral: { exit: (path: NodePath<t.NullLiteral>) => literalExit(path, 'Null') },
    NumericLiteral: { exit: (path: NodePath<t.NumericLiteral>) => literalExit(path, 'Number') },
    ObjectExpression: {
      exit: (path: NodePath<t.ObjectExpression>) => wrap(path, 'Object', 'created', getMethodLocations(path.node)),
    },
    OptionalCallExpression: {
      exit: (path: NodePath<t.OptionalCallExpression>) => {
        if (!isGeneratedHelperCall(path.node)) {
          wrap(path as NodePath<t.Expression>, 'Dynamic', 'observed')
        }
      },
    },
    RegExpLiteral: { exit: (path: NodePath<t.RegExpLiteral>) => wrap(path, 'RegExp') },
    StringLiteral: { exit: (path: NodePath<t.StringLiteral>) => literalExit(path, 'String') },
    TaggedTemplateExpression: {
      exit: (path: NodePath<t.TaggedTemplateExpression>) => wrap(path, 'Dynamic', 'observed'),
    },
    TemplateLiteral: {
      exit: (path: NodePath<t.TemplateLiteral>) => {
        if (!path.parentPath?.isTaggedTemplateExpression()) {
          wrap(path, 'String')
        }
      },
    },
    UnaryExpression: { exit: (path: NodePath<t.UnaryExpression>) => wrap(path, 'Dynamic') },
    UpdateExpression: { exit: (path: NodePath<t.UpdateExpression>) => wrap(path, 'Number') },
  }
}
