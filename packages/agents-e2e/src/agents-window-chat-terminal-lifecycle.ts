import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { connect as connectTaskReadiness } from '../helpers/TerminalTaskReadiness.ts'
import type { TestContext } from '../../e2e/types.ts'

interface Shell {
  name: string
  pid: number
  transient?: boolean
  start: string
}

const waitFor = async (condition: () => Promise<boolean>, description: string, timeout = 15_000): Promise<void> => {
  const deadline = Date.now() + timeout
  do {
    if (await condition()) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  } while (Date.now() < deadline)
  throw new Error(`Timed out waiting for ${description}`)
}

const identity = async (pid: number): Promise<string | undefined> => {
  try {
    const stat = await readFile(`/proc/${pid}/stat`, 'utf8')
    const fields = stat
      .slice(stat.lastIndexOf(')') + 2)
      .trim()
      .split(/\s+/)
    return fields[0] === 'Z' ? undefined : fields[19]
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT' || code === 'ESRCH') return undefined
    throw error
  }
}

const alive = async (shell: Shell): Promise<boolean> => (await identity(shell.pid)) === shell.start
const requireAlive = async (shells: Shell[], transition: string): Promise<void> => {
  for (const shell of shells) assert.ok(await alive(shell), `${shell.name} (${shell.pid}) exited during ${transition}`)
}

const readJson = async (path: string): Promise<any> => {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw error
  }
}

const cycle = async (context: TestContext, end: 'delete' | 'archive' | 'reload'): Promise<void> => {
  assert.equal(process.platform, 'linux', 'This process-identity scenario requires Linux /proc')
  const { AgentsWindow, Electron, Workbench } = context
  const fixtureParent = join(import.meta.dirname, '../../../.vscode-test-workspace')
  const token = `chat-terminal-lifecycle-418-${end}-${Date.now()}`
  const root = join(fixtureParent, token)
  const readinessDirectory = `${token}-ready`
  const journal = join(root, '.chat-window-terminals.json')
  const taskPids = join(root, '.chat-window-task-pids')
  const title = `Chat terminal ${end} ${Date.now()}`
  let child: Awaited<ReturnType<typeof Workbench.openChatWindow>> | undefined
  const shells: Shell[] = []
  const mainWindowId = (await Electron.getWindowIds())[0]
  const focusWindow = async (id: number): Promise<void> => {
    await Electron.evaluate(`globalThis._____electron.BrowserWindow.fromId(${id}).focus()`)
    await waitFor(
      async () => (await Electron.evaluate('globalThis._____electron.BrowserWindow.getFocusedWindow()?.id')) === id,
      'native window focus',
    )
  }
  const closeChild = async (): Promise<void> => {
    const auxiliaryId = (await Electron.getWindowIds()).find((id) => id !== mainWindowId)
    if (child && auxiliaryId !== undefined) {
      await focusWindow(auxiliaryId)
      await Electron.closeWindow(auxiliaryId)
      await Electron.waitForWindowCount(1)
    }
    child = undefined
  }
  const deleteSession = async (): Promise<void> => {
    await AgentsWindow.deleteChat(title)
  }
  let created = false
  const errors: unknown[] = []
  try {
    await Promise.all([journal, taskPids].map((path) => rm(path, { force: true })))
    await mkdir(join(root, '.vscode'), { recursive: true })
    await mkdir(join(root, readinessDirectory), { recursive: true })
    await writeFile(join(fixtureParent, '.chat-window-fixture-root'), root)
    const git = promisify(execFile)
    await git('git', ['init', '--initial-branch=main', root])
    await git('git', [
      '-C',
      root,
      '-c',
      'user.name=Terminal Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      `core.hooksPath=${root}/.git/no-hooks`,
      'commit',
      '--allow-empty',
      '--no-gpg-sign',
      '-m',
      'Initialize terminal fixture',
    ])
    await writeFile(
      join(root, '.vscode/tasks.json'),
      JSON.stringify({
        version: '2.0.0',
        tasks: [
          {
            label: 'Chat terminal lifecycle task',
            type: 'shell',
            inAgents: true,
            // A newly launched task shell can drop the first input character before its prompt is ready.
            // The OR fallback still writes the marker if the leading 'f' in "false" is dropped.
            command: String.raw`false || printf '%s\t%s\n' "$$" "$PWD" >> .chat-window-task-pids`,
            presentation: { panel: 'dedicated', clear: false },
            problemMatcher: [],
          },
        ],
      }),
    )
    await AgentsWindow.newChat()
    await AgentsWindow.selectWorkspace(root, readinessDirectory)
    created = true
    await AgentsWindow.sendNewChat(title)
    await AgentsWindow.shouldHaveReply('Hello from the mocked Agents window.')
    await AgentsWindow.shouldHaveSession(title)
    child = await Workbench.openChatWindow()
    await child.shouldBeVisible()
    await child.QuickPick.executeCommand('Chat Window Terminal Probe: Create')
    await waitFor(async () => Boolean(await readJson(journal)), 'two real editor terminal shells')
    const records = await readJson(journal)
    assert.equal(records.length, 2)
    for (const record of records) {
      assert.ok(Number.isInteger(record.pid) && record.pid > 0, 'Terminal API must expose a real shell PID')
      const start = await identity(record.pid)
      assert.ok(start, `${record.name} must be running before the transition`)
      shells.push({ ...record, start })
    }
    assert.deepEqual(
      shells.map((shell) => shell.transient),
      [true, false],
    )
    await closeChild()
    await requireAlive(shells, 'chat-window close')
    await AgentsWindow.newChat()
    await requireAlive(shells, 'session switch')
    await AgentsWindow.openChat(title)
    child = await Workbench.openChatWindow()
    await child.shouldBeVisible()
    await child.QuickPick.executeCommand('Chat Window Terminal Probe: Snapshot')
    const snapshot = join(root, '.chat-window-terminal-snapshot.json')
    await waitFor(async () => Boolean(await readJson(snapshot)), 'terminal API snapshot after reopening')
    const reopened = await readJson(snapshot)
    for (const shell of shells)
      assert.ok(
        reopened.some((entry: any) => entry.pid === shell.pid),
        'Reopening must reuse each editor terminal',
      )
    await requireAlive(shells, 'chat-window reopen')

    const userData = await Electron.evaluate('process.env.VMLF_CHAT_TERMINAL_USER_DATA')
    assert.equal(typeof userData, 'string', 'Task readiness requires the scenario-specific agent-host log fixture')
    const taskReadiness = await connectTaskReadiness(userData as string)
    const firstExecution = await taskReadiness.checkpoint()
    await child.QuickPick.executeCommand('Agents: Run Primary Task')
    // Let the renderer finish the task action before requiring its asynchronously captured AHP completion event.
    await child.waitForIdle()
    const taskOwner = await taskReadiness.waitAfter(firstExecution)
    const readPids = async (): Promise<number[]> => {
      try {
        const text = (await readFile(taskPids, 'utf8')).trim()
        if (!text) return []
        return text.split('\n').map((line) => {
          const [pid, cwd] = line.split('\t')
          assert.equal(cwd, root, 'Every task execution must use the isolated fixture workspace')
          assert.ok(Number.isInteger(Number(pid)) && Number(pid) > 0, 'Task record must contain a real shell PID')
          return Number(pid)
        })
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
        throw error
      }
    }
    await waitFor(async () => (await readPids()).length === 1, 'session task shell marker')
    const taskPid = (await readPids())[0]
    const start = await identity(taskPid)
    assert.ok(start, 'Session task shell must be alive')
    const taskShell = { name: 'session task shell', pid: taskPid, start }
    shells.push(taskShell)
    console.log('Chat terminal lifecycle: shell identities', JSON.stringify({ end, root, shells }))
    const shown = async (): Promise<boolean> =>
      Boolean(
        await child!.evaluate({ expression: '!!document.querySelector(".chat-window-terminals-part .xterm")?.getClientRects().length' }),
      )
    await waitFor(shown, 'task terminal shown in the owning chat window')
    await child.QuickPick.executeCommand('Agents: Toggle Terminal in Chat Window')
    await waitFor(async () => !(await shown()), 'task terminal hidden in the owning chat window')
    await requireAlive(shells, 'hiding task terminals')
    const secondExecution = await taskReadiness.checkpoint()
    await child.QuickPick.executeCommand('Agents: Run Primary Task')
    await child.waitForIdle()
    await taskReadiness.waitAfter(secondExecution, taskOwner)
    assert.deepEqual(await readPids(), [taskPid, taskPid], 'Hidden task must reuse its existing shell')
    await requireAlive(shells, 'hidden task reuse')

    if (end === 'reload') {
      await focusWindow(mainWindowId)
      const restoredWindow = Workbench.waitForNewWindowReady(30_000, 'about:blank')
      void restoredWindow.catch(() => {})
      console.log('Chat terminal lifecycle: starting main renderer reload')
      await Workbench.reload()
      console.log('Chat terminal lifecycle: main renderer reconnected')
      await waitFor(
        async () => !(await alive(shells.find((shell) => shell.transient)!)) && !(await alive(taskShell)),
        'nonpersistent editor and task shells to exit after reload',
      )
      const persistent = shells.find((shell) => shell.transient === false)!
      await requireAlive([persistent], 'reload of the owning renderer')
      console.log('Chat terminal lifecycle: nonpersistent shell shutdown verified')
      child = await restoredWindow
      console.log('Chat terminal lifecycle: auxiliary window reattached')
      const restoredId = (await Electron.getWindowIds()).find((id) => id !== mainWindowId)
      assert.ok(restoredId !== undefined, 'Reload must restore a native auxiliary window')
      await focusWindow(restoredId)
      await child.shouldBeVisible()
      assert.equal(await child.evaluate({ expression: 'location.href' }), 'about:blank', 'Reload must restore an auxiliary chat window')
      // Release the restored chat surface before attaching a detached local shell.
      // Otherwise the session can immediately adopt it while Attach is still focusing it.
      await closeChild()
      await requireAlive([persistent], 'closing the restored chat surface')
      await focusWindow(mainWindowId)
      await AgentsWindow.openChat(title)
      const reconnectDeadline = Date.now() + 15_000
      let reloaded: any[] = []
      while (true) {
        await rm(snapshot, { force: true })
        await context.QuickPick.executeCommand('Chat Window Terminal Probe: Snapshot')
        await waitFor(async () => Boolean(await readJson(snapshot)), 'terminal API snapshot after reload')
        reloaded = await readJson(snapshot)
        if (reloaded.filter((entry: any) => entry.pid === persistent.pid).length === 1 || Date.now() >= reconnectDeadline) break
      }
      console.log('Chat terminal lifecycle: restored API terminals', JSON.stringify(reloaded))
      if (!reloaded.some((entry: any) => entry.pid === persistent.pid)) {
        // Extension-created editor terminals can remain detached after reload. Reconnect through the real session picker.
        await focusWindow(mainWindowId)
        await context.QuickPick.executeCommand('Terminal: Attach to Session', { stayVisible: true })
        await context.QuickPick.select(persistent.name)
        // The pinned runtime can reconnect successfully, then fail to focus a background terminal.
        // Handle only that exact focus defect; the shell round trip below independently proves usable reattachment.
        const dismissFocusError = async (): Promise<boolean> => {
          const message = await Workbench.evaluate({
            expression: String.raw`(() => {
            const dialog = document.querySelector('.monaco-dialog-box')
            const text = dialog?.textContent || ''
            if (!text.includes("Command 'Terminal: Attach to Session' resulted in an error") ||
                !/Terminal with ID \d+ does not exist \(has it already been disposed\?\)/.test(text)) return ''
            const ok = Array.from(dialog.querySelectorAll('.monaco-button')).find(button => button.textContent === 'OK')
            if (!ok) throw new Error('Known terminal focus error has no OK button')
            ok.click()
            return text
          })()`,
          })
          if (!message) return false
          console.warn('Persistent terminal reattached with a known UI focus error:', message)
          return true
        }
        await dismissFocusError()
        // Read the API identity in the main window after the command has settled.
        await focusWindow(mainWindowId)
        await rm(snapshot, { force: true })
        try {
          await context.QuickPick.executeCommand('Chat Window Terminal Probe: Snapshot')
        } catch (error) {
          if (!(await dismissFocusError())) throw error
          await context.QuickPick.executeCommand('Chat Window Terminal Probe: Snapshot')
        }
        await waitFor(async () => Boolean(await readJson(snapshot)), 'persistent terminal API after explicit reconnect')
        reloaded = await readJson(snapshot)
        console.log('Chat terminal lifecycle: explicitly reconnected API terminals', JSON.stringify(reloaded))
      }
      assert.equal(
        reloaded.filter((entry: any) => entry.pid === persistent.pid).length,
        1,
        'Persistent editor shell must reconnect exactly once',
      )
      assert.equal(
        reloaded.filter((entry: any) => entry.name === shells.find((shell) => shell.transient)!.name).length,
        0,
        'Transient editor terminal must not revive',
      )

      await context.QuickPick.executeCommand('Chat Window Terminal Probe: Verify Reconnect')
      await waitFor(async () => {
        try {
          return Number((await readFile(join(root, '.chat-window-reconnected-pid'), 'utf8')).trim()) === persistent.pid
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
          throw error
        }
      }, 'a command round trip through the original persistent shell')
      await requireAlive([persistent], 'persistent terminal round trip')
      await context.QuickPick.executeCommand('Chat Window Terminal Probe: Cleanup')
      await waitFor(async () => !(await alive(persistent)), 'explicitly reattached fixture terminal disposal')
    }

    await focusWindow(mainWindowId)
    if (end === 'archive') await AgentsWindow.archiveChat(title)
    else {
      await deleteSession()
      created = false
    }
    await waitFor(async () => (await Promise.all(shells.map(alive))).every((value) => !value), `all ${end} session shells to exit`)
    console.log(
      end === 'reload'
        ? 'Verified reload: transient/task shells exited; persistent shell reconnected once, accepted a command, and was disposed by the fixture'
        : `Verified ${end}: transient, persistent and reused task shell processes exited`,
    )
  } catch (error) {
    errors.push(error)
  } finally {
    try {
      await closeChild()
    } catch (error) {
      errors.push(error)
    }
    if (created) {
      try {
        await focusWindow(mainWindowId)
        await deleteSession()
      } catch (error) {
        errors.push(error)
      }
    }
    // Session deletion removes its row before all terminal exit notifications arrive.
    try {
      await waitFor(async () => (await Promise.all(shells.map(alive))).every((value) => !value), 'normal fixture shell shutdown', 5_000)
    } catch (error) {
      errors.push(error)
    }
    // Rescue only known fixture process identities, after recording assertion failures.
    for (const shell of shells) {
      if (await alive(shell)) {
        try {
          console.warn(`Rescuing fixture shell ${shell.name} (${shell.pid}) after failed assertions or cleanup`)
          process.kill(shell.pid, 'SIGKILL')
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH') errors.push(error)
        }
      }
    }
    try {
      await waitFor(async () => (await Promise.all(shells.map(alive))).every((value) => !value), 'fixture shell cleanup')
      await rm(root, { recursive: true, force: true })
      await rm(join(fixtureParent, '.chat-window-fixture-root'), { force: true })
    } catch (error) {
      errors.push(error)
    }
  }
  if (errors.length) throw new AggregateError(errors, `Chat-window terminal ${end} lifecycle failed: ${errors.map(String).join('; ')}`)
}

export const setup = async (context: TestContext): Promise<void> => {
  await cycle(context, 'delete')
}

export const run = async (context: TestContext): Promise<void> => {
  await cycle(context, 'delete')
  await cycle(context, 'archive')
  await cycle(context, 'reload')
}
