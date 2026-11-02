import assert from 'node:assert/strict'
import { readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import type { TestContext } from '../types.ts'

export const command = async ({ QuickPick, Workspace }: TestContext, action: string, onCleared?: () => Promise<void>): Promise<void> => {
  const resultPath = join(Workspace.getWorkspacePath(), 'marker-signals-result.json')
  const acknowledgement = join(Workspace.getWorkspacePath(), 'marker-signals-continue.txt')
  await rm(resultPath, { force: true })
  await rm(acknowledgement, { force: true })
  await QuickPick.executeCommand(`Marker Signals: ${action[0].toUpperCase()}${action.slice(1)}`)
  await writeFile(acknowledgement, `${action}:start`)
  let acknowledged = false
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline) {
    let text: string
    try {
      text = await readFile(resultPath, 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      await setTimeout(20)
      continue
    }
    const result = JSON.parse(text)
    assert.equal(result.action, action)
    assert.equal(result.error, undefined)
    if (result.phase === 'cleared') {
      assert.ok(onCleared, 'Missing diagnostic-clear acknowledgement')
      if (!acknowledged) {
        await onCleared()
        await writeFile(acknowledgement, `${action}:publish`)
        acknowledged = true
      }
      await setTimeout(20)
      continue
    }
    assert.equal(result.phase, 'done')
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
  const state = await Workbench.evaluate({
    expression: `JSON.stringify({aria: Array.from(document.querySelectorAll('.monaco-aria-container')).map(node => node.textContent), markers: document.querySelectorAll('.squiggly-error, .squiggly-warning').length, editor: document.querySelector('.monaco-editor textarea')?.getAttribute('aria-label')})`,
  })
  throw new Error(`Marker Signals condition did not become true: ${expression}; state: ${state}`)
}

export const expectSignal = async (context: TestContext, severity: 'Error' | 'Warning'): Promise<void> => {
  await waitFor(
    context,
    `Array.from(document.querySelectorAll('.monaco-aria-container .monaco-status')).some(node => node.textContent === '${severity}' || node.textContent === '${severity} on Line')`,
  )
}

export const moveToMarker = async (context: TestContext, line: 2 | 4): Promise<void> => {
  await command(context, line === 2 ? 'error' : 'warning')
}

export const setup = async (context: TestContext): Promise<void> => {
  const { Editor, Workspace } = context
  await Editor.closeAll()
  await Workspace.setFiles(
    ['primary.txt', 'secondary.txt'].map((name) => ({ name, content: 'start\nerror here\nneutral\nwarning here\nend\n' })),
  )
  await command(context, 'setup')
  await moveToMarker(context, 4)
  await expectSignal(context, 'Warning')
  await moveToMarker(context, 2)
  await expectSignal(context, 'Error')
}

export const teardown = async (context: TestContext): Promise<void> => {
  await command(context, 'cleanup')
  await context.Workspace.remove('.vscode/settings.json')
}
