import assert from 'node:assert/strict'
import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { TestContext } from '../types.ts'

export const command = async ({ QuickPick, Workspace }: TestContext, action: string): Promise<void> => {
  const resultPath = join(Workspace.getWorkspacePath(), 'marker-signals-result.json')
  await rm(resultPath, { force: true })
  await QuickPick.executeCommand(`Marker Signals: ${action[0].toUpperCase()}${action.slice(1)}`)
  const deadline = Date.now() + 10_000
  while (Date.now() < deadline) {
    let text: string
    try {
      text = await readFile(resultPath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      await setTimeout(20)
      continue
    }
    // A filesystem write may still be in progress.
    if (!text.endsWith('}')) {
      await setTimeout(20)
      continue
    }
    const result = JSON.parse(text)
    assert.equal(result.action, action)
    assert.equal(result.error, undefined)
    return
  }
  throw new Error(`Marker Signals command did not complete: ${action}`)
}

export const waitFor = async ({ Workbench }: TestContext, expression: string): Promise<void> => {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    if (await Workbench.evaluate({ expression })) return
    await setTimeout(20)
  }
  throw new Error(`Marker Signals condition did not become true: ${expression}`)
}

export const expectSignal = async (context: TestContext, severity: 'Error' | 'Warning'): Promise<void> => {
  await waitFor(
    context,
    `Array.from(document.querySelectorAll('.monaco-aria-container .monaco-status')).some(node => node.textContent === '${severity}' || node.textContent === '${severity} on Line')`,
  )
}

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Workspace } = context
  await Editor.closeAll()
  await Workspace.setFiles(
    ['primary.txt', 'secondary.txt'].map((name) => ({ name, content: 'start\nerror here\nneutral\nwarning here\nend\n' })),
  )
  await Workspace.writeWorkspaceSettings({
    'accessibility.signalOptions.debouncePositionChanges': false,
    'accessibility.signals.lineHasError': { sound: 'off', announcement: 'on' },
    'accessibility.signals.lineHasWarning': { sound: 'off', announcement: 'on' },
    'accessibility.signals.positionHasError': { sound: 'off', announcement: 'on' },
    'accessibility.signals.positionHasWarning': { sound: 'off', announcement: 'on' },
    'editor.stickyScroll.enabled': false,
    'git.enabled': false,
  })
  await command(context, 'setup')
  await Editor.setCursor(4, 2)
  await expectSignal(context, 'Warning')
  await Editor.setCursor(2, 2)
  await expectSignal(context, 'Error')
}

export const teardown = async (context: TestContext): Promise<void> => {
  await command(context, 'cleanup')
  await context.Workspace.remove('.vscode/settings.json')
}
