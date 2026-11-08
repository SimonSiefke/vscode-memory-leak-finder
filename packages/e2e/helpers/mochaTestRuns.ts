import { randomUUID } from 'node:crypto'
import { cp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import type { TestContext } from '../types.ts'

const fixture = join(import.meta.dirname, '../fixtures/mocha-test-runs')
const total = 5000
const completionBudget = 30_000

const withinDeadline = async <T>(operation: Promise<T>, deadline: number, message: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), Math.max(0, deadline - Date.now()))
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

const clearResults = async ({ QuickPick, Workbench }: TestContext): Promise<void> => {
  const hasResults = await Workbench.evaluate({ expression: "!!document.querySelector('.test-explorer .result-summary')" })
  // The command is absent from the palette until a result exists.
  if (hasResults) await QuickPick.executeCommand('Test: Clear All Results')
}

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Notification, Panel, QuickPick, Testing, Workbench, Workspace } = context
  await Editor.closeAll()
  await Panel.hide()
  await Workspace.setFiles([
    { name: 'package.json', content: await readFile(join(fixture, 'package.json'), 'utf8') },
    {
      name: '.vscode/settings.json',
      content: JSON.stringify({
        'mocha-vscode.runtime': 'node',
        'testing.automaticallyOpenPeekView': 'never',
        'testing.openTesting': 'neverOpen',
      }),
    },
  ])
  // Prepare dependencies before publishing the Mocha config to the file watcher.
  // Install the fixture and extension before launch; see the fixture README.
  await cp(join(fixture, 'node_modules'), join(Workspace.getWorkspacePath(), 'node_modules'), { recursive: true })
  await Workspace.writeFile('test/bulk.test.cjs', await readFile(join(fixture, 'bulk.test.cjs'), 'utf8'))
  await Workspace.writeFile('.mocharc.json', JSON.stringify({ spec: ['test/**/*.test.cjs'], timeout: 2000 }))
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand('Mocha Bulk Tests: Discover')
  await Notification.shouldHaveItem('Mocha bulk discovery complete')
  await Notification.closeAll({ force: true })
  await Testing.focusOnTestExplorerView()
  await Workbench.evaluate({
    expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 60000
      const check = () => {
        const tree = document.querySelector('[role="tree"][aria-label="Test Explorer"]')
        if (tree?.textContent.includes('case 0000')) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Mocha bulk suite was not discovered; install coderline.mocha-vscode and enable extensions'))
        tree?.querySelector('.monaco-list-row[aria-expanded="false"] .monaco-tl-twistie')?.click()
        setTimeout(check, 100)
      }
      check()
    })`,
    awaitPromise: true,
  })
  await clearResults(context)
}

export const runSuite = async (context: TestContext, mixed: boolean): Promise<void> => {
  const { QuickPick, Workbench, Workspace } = context
  const workspace = Workspace.getWorkspacePath()
  const token = randomUUID()
  const reportPath = join(workspace, '.mocha-complete.json')
  await rm(reportPath, { force: true })
  await writeFile(join(workspace, '.mocha-run.json'), JSON.stringify({ token, mixed }))
  // QuickPick.executeCommand waits for renderer idleness after dispatch. Bulk
  // updates can exceed that helper's five-second idle timeout, so dispatch the
  // visible Run Tests action directly and use the completion budget below.
  await Workbench.evaluate({
    expression: `(() => {
      const button = document.querySelector('[aria-label="Run Tests"]')
      if (!button || !button.getClientRects().length) throw new Error('Run Tests action is not visible')
      button.click()
    })()`,
  })

  // This marker comes from the test process, independently of renderer progress.
  // A completed command or an absent spinner alone can also mean no tests ran.
  const runnerDeadline = Date.now() + 60_000
  let report: { token: string; passed: number; failed: number; skipped: number; finishedAt: number }
  for (;;) {
    const content = await readFile(reportPath, 'utf8').catch(() => '')
    if (content) {
      report = JSON.parse(content)
      if (report.token === token) break
    }
    if (Date.now() > runnerDeadline) throw new Error('Mocha did not finish 5000 tests within 60 seconds')
    await delay(100)
  }
  const passed = mixed ? total - 10 : total
  if (report.passed !== passed || report.failed !== (mixed ? 5 : 0) || report.skipped !== (mixed ? 5 : 0)) {
    throw new Error(`Unexpected Mocha results: ${JSON.stringify(report)}`)
  }

  // Alternate outcomes on consecutive runs so the previous summary cannot pass.
  const summary = `${passed}/${mixed ? total - 5 : total}`
  const deadline = report.finishedAt + completionBudget
  for (;;) {
    const state = (await withinDeadline(
      Workbench.evaluate({
        expression: `(() => {
        const summary = document.querySelector('.test-explorer .result-summary')
        return { text: summary?.textContent || '', running: !!summary?.querySelector('.codicon-loading') }
      })()`,
      }),
      deadline,
      'Testing UI did not respond within 30 seconds after Mocha finished',
    )) as { text: string; running: boolean }
    // Check wall time after the renderer responds as well: its event loop can stall.
    if (Date.now() > deadline) {
      throw new Error(
        `Testing UI took more than ${completionBudget}ms after Mocha finished; expected ${summary}, observed ${JSON.stringify(state)}`,
      )
    }
    if (state.text.includes(summary) && !state.running) break
    await delay(100)
  }

  await withinDeadline(
    QuickPick.executeCommand('Test: Show Output'),
    deadline,
    'Test Results view did not open within the completion budget',
  )
  await withinDeadline(
    Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = ${deadline}
      const check = () => {
        const output = document.querySelector('.test-output-peek-message-container')
        if (output?.textContent.includes(${JSON.stringify(`MOCHA_COMPLETE ${token}`)})) return resolve(true)
        if (Date.now() > deadline) return reject(new Error('Latest Mocha output did not reach the Test Results view'))
        setTimeout(check, 100)
      }
      check()
    })`,
      awaitPromise: true,
    }),
    deadline,
    'Test Results output did not respond within the completion budget',
  )
  if (Date.now() > deadline) throw new Error('Test Results output exceeded the completion budget')
  await context.Panel.hide()
}

export const teardown = async (context: TestContext): Promise<void> => {
  const { Editor, Notification, Panel, Workspace } = context
  try {
    await clearResults(context)
  } finally {
    await rm(join(Workspace.getWorkspacePath(), '.mocha-run.json'), { force: true })
    await rm(join(Workspace.getWorkspacePath(), '.mocha-complete.json'), { force: true })
    await Notification.closeAll({ force: true })
    await Editor.closeAll()
    await Panel.hide()
  }
}

export const runSuites = async (context: TestContext, outcomes: readonly boolean[]): Promise<void> => {
  for (const mixed of outcomes) await runSuite(context, mixed)
  // Keep intentionally retained result history out of the next leak iteration.
  await teardown(context)
}
