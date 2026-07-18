import type { NodePath, Visitor } from '@babel/core'
import * as t from '@babel/types'

export interface CreateEverythingWrapperPluginOptions {
  readonly scriptId?: number | string
}

interface RestBinding {
  readonly hint: 'Array' | 'Object'
  readonly identifier: t.Identifier
  readonly node: t.RestElement
}

const helperName = '__vscodeMemoryLeakFinderTrackEverything'
const createHelper = (): t.MemberExpression => t.memberExpression(t.identifier('globalThis'), t.identifier(helperName))

const getLocationNodes = (node: t.Node, scriptIdNode: t.Expression): readonly t.Expression[] => {
  return [scriptIdNode, t.numericLiteral(node.loc?.start.line ?? -1), t.numericLiteral(node.loc?.start.column ?? -1)]
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
    : node.body.body.filter((element) => t.isClassMethod(element) || t.isClassPrivateMethod(element))
  return t.arrayExpression(
    methods.map((method) =>
      t.arrayExpression([t.numericLiteral(method.loc?.start.line ?? -1), t.numericLiteral(method.loc?.start.column ?? -1)]),
    ),
  )
}

const collectRestBindings = (node: t.Node | null | undefined, hint: 'Array' | 'Object', output: RestBinding[]): void => {
  if (!node) {
    return
  }
  if (t.isRestElement(node)) {
    if (t.isIdentifier(node.argument)) {
      output.push({ hint, identifier: node.argument, node })
    } else {
      collectRestBindings(node.argument, hint, output)
    }
    return
  }
  if (t.isObjectPattern(node)) {
    for (const property of node.properties) {
      if (t.isRestElement(property)) {
        collectRestBindings(property, 'Object', output)
      } else {
        collectRestBindings(property.value, 'Object', output)
      }
    }
    return
  }
  if (t.isArrayPattern(node)) {
    for (const element of node.elements) {
      collectRestBindings(element, 'Array', output)
    }
    return
  }
  if (t.isAssignmentPattern(node)) {
    collectRestBindings(node.left, hint, output)
  }
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
    if (
      path.findParent(
        (parent) =>
          (parent.isCallExpression() || parent.isOptionalCallExpression()) &&
          isGeneratedHelperCall(parent.node as t.CallExpression | t.OptionalCallExpression),
      )
    ) {
      return
    }
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

  const createRegistrationCall = (
    value: t.Expression,
    node: t.Node,
    hint: string,
    methods: t.ArrayExpression = t.arrayExpression(),
  ): t.ExpressionStatement => {
    return t.expressionStatement(
      t.callExpression(createHelper(), [
        value,
        ...getLocationNodes(node, scriptIdNode),
        t.stringLiteral(hint),
        t.stringLiteral('created'),
        methods,
      ]),
    )
  }

  const getRestRegistrations = (nodes: readonly (t.Node | null | undefined)[], defaultHint: 'Array' | 'Object') => {
    const bindings: RestBinding[] = []
    for (const node of nodes) {
      collectRestBindings(node, defaultHint, bindings)
    }
    return bindings.map((binding) => createRegistrationCall(t.identifier(binding.identifier.name), binding.node, binding.hint))
  }

  const prependRegistrations = (body: t.BlockStatement, registrations: readonly t.ExpressionStatement[]): void => {
    body.body.unshift(...registrations)
  }

  const registerRestParameter = (path: NodePath<any>): void => {
    const registrations = getRestRegistrations(path.node.params || [], 'Array')
    if (registrations.length === 0) {
      return
    }
    if (t.isBlockStatement(path.node.body)) {
      prependRegistrations(path.node.body, registrations)
      return
    }
    path.node.body = t.blockStatement([...registrations, t.returnStatement(path.node.body as t.Expression)])
  }

  const registerVariableRestBindings = (path: NodePath<t.VariableDeclaration>): void => {
    const registrations = getRestRegistrations(
      path.node.declarations.map((declaration) => declaration.id),
      'Array',
    )
    if (registrations.length === 0) {
      return
    }
    if (path.parentPath?.isForInStatement() || path.parentPath?.isForOfStatement()) {
      const loop = path.parentPath.node
      if (!t.isBlockStatement(loop.body)) {
        loop.body = t.blockStatement([loop.body])
      }
      prependRegistrations(loop.body, registrations)
      return
    }
    if (path.parentPath?.isProgram() || path.parentPath?.isBlockStatement()) {
      path.insertAfter(registrations)
    }
  }

  const registerDeclaration = (path: NodePath<t.FunctionDeclaration | t.ClassDeclaration>, hint: string): void => {
    const { id } = path.node
    const { node } = path
    const methods = t.isClassDeclaration(node) ? getMethodLocations(node) : t.arrayExpression()
    const call = createRegistrationCall(id ? t.identifier(id.name) : t.unaryExpression('void', t.numericLiteral(0)), node, hint, methods)
    path.insertAfter(call)
  }

  const literalExit = (path: NodePath<t.Expression>, hint: string): void => {
    if (shouldTrackLiteral(path)) {
      wrap(path, hint)
    }
  }

  return {
    ArrayExpression: { exit: (path: NodePath<t.ArrayExpression>) => wrap(path, 'Array') },
    ArrowFunctionExpression: {
      exit: (path: NodePath<t.ArrowFunctionExpression>) => {
        registerRestParameter(path)
        wrap(path, 'Function')
      },
    },
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
    CatchClause: {
      exit: (path: NodePath<t.CatchClause>) => {
        const registrations = getRestRegistrations([path.node.param], 'Object')
        prependRegistrations(path.node.body, registrations)
      },
    },
    ClassDeclaration: { exit: (path: NodePath<t.ClassDeclaration>) => registerDeclaration(path, 'Class') },
    ClassExpression: {
      exit: (path: NodePath<t.ClassExpression>) => wrap(path, 'Class', 'created', getMethodLocations(path.node)),
    },
    ClassMethod: { exit: (path: NodePath<t.ClassMethod>) => registerRestParameter(path) },
    ClassPrivateMethod: { exit: (path: NodePath<t.ClassPrivateMethod>) => registerRestParameter(path) },
    FunctionDeclaration: {
      exit: (path: NodePath<t.FunctionDeclaration>) => {
        registerRestParameter(path)
        registerDeclaration(path, 'Function')
      },
    },
    FunctionExpression: {
      exit: (path: NodePath<t.FunctionExpression>) => {
        registerRestParameter(path)
        wrap(path, 'Function')
      },
    },
    NewExpression: {
      exit: (path: NodePath<t.NewExpression>) => wrap(path, getCalleeName(path.node.callee)),
    },
    NullLiteral: { exit: (path: NodePath<t.NullLiteral>) => literalExit(path, 'Null') },
    NumericLiteral: { exit: (path: NodePath<t.NumericLiteral>) => literalExit(path, 'Number') },
    ObjectExpression: {
      exit: (path: NodePath<t.ObjectExpression>) => wrap(path, 'Object', 'created', getMethodLocations(path.node)),
    },
    ObjectMethod: { exit: (path: NodePath<t.ObjectMethod>) => registerRestParameter(path) },
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
    VariableDeclaration: { exit: registerVariableRestBindings },
  }
}
