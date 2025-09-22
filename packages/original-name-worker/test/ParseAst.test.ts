import { test, expect } from '@jest/globals'
import { parseAst } from '../src/parts/ParseAst/ParseAst.ts'

test('parseAst - simple class', () => {
  const sourceContent = `class Test {
    method() {
      return 1
    }
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('ClassDeclaration')
})

test('parseAst - anonymous class extends', () => {
  const sourceContent = `const abc = class extends Test {
    constructor(value) {
      this.value = value
    }
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('ClassDeclaration')

  // Check that the class name was added
  const classDecl = ast.program.body[0] as any
  expect(classDecl.id.name).toBe('AnonymousClass')
  expect(classDecl.superClass.name).toBe('Test')
})

test('parseAst - class with extends and name', () => {
  const sourceContent = `class MyClass extends Test {
    method() {
      return 1
    }
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('ClassDeclaration')

  // Check that the class name was preserved
  const classDecl = ast.program.body[0] as any
  expect(classDecl.id.name).toBe('MyClass')
  expect(classDecl.superClass.name).toBe('Test')
})

test('parseAst - template literals', () => {
  const sourceContent = `class Test {
    serialize() {
      return \`\${this.key} > \${this.value}\`
    }
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('ClassDeclaration')
})

test('parseAst - TypeScript interface', () => {
  const sourceContent = `interface Test {
    method(): string
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('TSInterfaceDeclaration')
})

test('parseAst - empty content', () => {
  expect(() => parseAst('')).toThrow('No source content provided')
})

test('parseAst - invalid syntax', () => {
  const sourceContent = `class Test {
    method() {
      return 1
    }
  } invalid syntax here`

  // With errorRecovery: true, Babel will parse what it can and ignore the rest
  // So this should not throw, but the AST will contain extra nodes
  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  // The class should be the first node
  expect(ast.program.body[0].type).toBe('ClassDeclaration')
  // There will be additional nodes from the invalid syntax
  expect(ast.program.body.length).toBeGreaterThan(1)
})

test('parseAst - large file with complex syntax', () => {
  const sourceContent = `class ContextKeyGreaterExpr implements IContextKeyExpr {
    public readonly key: string
    public readonly value: any
    public readonly negated: ContextKeyExpression | undefined

    constructor(key: string, value: any, negated?: ContextKeyExpression) {
      this.key = key
      this.value = value
      this.negated = negated
    }

    public substituteConstants(): ContextKeyExpression | undefined {
      return this
    }

    public evaluate(context: IContext): boolean {
      if (typeof this.value === 'string') {
        return false
      }
      return (parseFloat(<any>context.getValue(this.key)) > this.value)
    }

    public serialize(): string {
      return \`\${this.key} > \${this.value}\`
    }

    public keys(): string[] {
      return [this.key]
    }

    public map(mapFnc: IContextKeyExprMapper): ContextKeyExpression {
      return mapFnc.mapGreater(this.key, this.value)
    }
  }`

  const ast = parseAst(sourceContent)
  expect(ast.type).toBe('File')
  expect(ast.program.body).toHaveLength(1)
  expect(ast.program.body[0].type).toBe('ClassDeclaration')
})
