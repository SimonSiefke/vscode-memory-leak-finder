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

// @ts-ignore
export const run = async ({ QuickPick, Editor, Terminal, page, expect, VError }: TestContext): Promise<void> => {
  await page.waitForIdle()

  await QuickPick.executeCommand('Tasks: Run Task')
  await page.waitForIdle()

  await QuickPick.select('run tests')
  await page.waitForIdle()

  const panel = page.locator('.part.panel')
  await expect(panel).toBeVisible()
  await page.waitForIdle()

  const terminal = page.locator('.terminal')
  await expect(terminal).toBeVisible()
  await page.waitForIdle()

  const terminalActions = page.locator('[aria-label="Terminal actions"]')
  await expect(terminalActions).toBeVisible({ timeout: 10000 })
  await page.waitForIdle()

  const actionLabel = terminalActions.locator('.action-label')
  await expect(actionLabel).toBeVisible()
  await page.waitForIdle()

  const successDecoration = terminal.locator('.codicon-terminal-decoration-success, .codicon-check')
  await expect(successDecoration.first()).toBeVisible({ timeout: 15000 })
  await page.waitForIdle()

  await Editor.open('src/math.test.js')
  await page.waitForIdle()

  await Editor.select('5')
  await page.waitForIdle()

  await page.keyboard.press('Backspace')
  await page.waitForIdle()

  await Editor.type('99')
  await page.waitForIdle()

  await Editor.save()
  await page.waitForIdle()

  await Terminal.killAll()
  await page.waitForIdle()

  await QuickPick.executeCommand('Tasks: Run Task')
  await page.waitForIdle()

  await QuickPick.select('run tests')
  await page.waitForIdle()

  await expect(panel).toBeVisible()
  await page.waitForIdle()

  await expect(terminal).toBeVisible()
  await page.waitForIdle()

  const errorDecoration = terminal.locator('.codicon-terminal-decoration-error, .codicon-error')
  await expect(errorDecoration.first()).toBeVisible({ timeout: 15000 })
  await page.waitForIdle()
}
