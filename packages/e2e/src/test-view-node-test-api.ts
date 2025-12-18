import type { TestContext } from '../types.ts'

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'package.json',
      content: JSON.stringify(
        {
          name: 'test-node-test-runner',
          version: '1.0.0',
          type: 'module',
          scripts: {
            test: 'node --test',
          },
        },
        null,
        2,
      ),
    },
    {
      name: 'src/math.js',
      content: `export function add(a, b) {
  return a + b
}

export function subtract(a, b) {
  return a - b
}

export function multiply(a, b) {
  return a * b
}
`,
    },
    {
      name: 'src/math.test.js',
      content: `import { test } from 'node:test'
import assert from 'node:assert'
import { add, subtract, multiply } from './math.js'

test('add two numbers', () => {
  assert.strictEqual(add(2, 3), 5)
})

test('subtract two numbers', () => {
  assert.strictEqual(subtract(5, 3), 2)
})

test('multiply two numbers', () => {
  assert.strictEqual(multiply(3, 4), 12)
})
`,
    },
    {
      name: '.vscode/tasks.json',
      content: JSON.stringify(
        {
          version: '2.0.0',
          tasks: [
            {
              label: 'run tests',
              type: 'shell',
              command: 'npm',
              args: ['test'],
              group: {
                kind: 'test',
                isDefault: true,
              },
              presentation: {
                reveal: 'always',
                panel: 'shared',
              },
              problemMatcher: [],
            },
          ],
        },
        null,
        2,
      ),
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Testing, Editor, Terminal }: TestContext): Promise<void> => {
  await Testing.runTask('run tests')
  await Testing.shouldHaveTestSuccess()

  await Editor.open('src/math.test.js')
  await Editor.select('5')
  await Editor.type('99')
  await Editor.save()

  await Terminal.killAll()

  await Testing.runTask('run tests')
  await Testing.shouldHaveTestFailure()
}
