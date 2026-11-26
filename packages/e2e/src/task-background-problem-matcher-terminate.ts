import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { execPath } from 'node:process'
import { setTimeout } from 'node:timers/promises'
import type { TestContext } from '../types.ts'

export const skip = 1

const taskLabel = 'fixture watch'
const pidFile = '.task-pid'
// Cycle 0 and 2 report one error, cycle 1 and 3 report none.
const cycleCount = 4

const watchScript = `import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
writeFileSync(join(root, '${pidFile}'), String(process.pid))

const printCycle = (cycle) => {
  console.log('CYCLE BEGIN ' + cycle)
  if (cycle % 2 === 0) {
    console.log('src/app.txt:2:5: error: fixture background error ' + cycle)
  }
  console.log('CYCLE END ' + cycle)
}

let cycle = 0
printCycle(cycle)
setInterval(() => {
  if (existsSync(join(root, '.advance-' + (cycle + 1)))) {
    cycle++
    printCycle(cycle)
  }
}, 50)
`

const tasksJson = JSON.stringify(
  {
    tasks: [
      {
        args: ['${workspaceFolder}/watch.mjs'],
        command: execPath,
        isBackground: true,
        label: taskLabel,
        options: {
          cwd: '${workspaceFolder}',
        },
        presentation: {
          panel: 'dedicated',
          reveal: 'always',
        },
        problemMatcher: {
          background: {
            activeOnStart: true,
            beginsPattern: '^CYCLE BEGIN',
            endsPattern: '^CYCLE END',
          },
          fileLocation: ['relative', '${workspaceFolder}'],
          owner: 'vmlf-background',
          pattern: {
            column: 3,
            file: 1,
            line: 2,
            message: 4,
            regexp: '^(.+):(\\d+):(\\d+): error: (.+)$',
          },
        },
        type: 'process',
      },
    ],
    version: '2.0.0',
  },
  null,
  2,
)

const isAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error && (error as NodeJS.ErrnoException).code === 'ESRCH') {
      return false
    }
    throw error
  }
}

const readPid = async (Workspace: TestContext['Workspace']): Promise<number> => {
  const content = await readFile(join(Workspace.getWorkspacePath(), pidFile), 'utf8').catch(() => '')
  const pid = Number.parseInt(content, 10)
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(`Expected ${pidFile} to contain the task process id, got "${content}"`)
  }
  return pid
}

const waitForExit = async (pid: number, timeout = 10_000): Promise<void> => {
  const deadline = Date.now() + timeout
  while (isAlive(pid)) {
    if (Date.now() > deadline) {
      throw new Error(`Expected task process ${pid} to exit within ${timeout}ms`)
    }
    await setTimeout(50)
  }
}

const removeSignalFiles = async (Workspace: TestContext['Workspace']): Promise<void> => {
  await Workspace.remove(pidFile)
  for (let cycle = 1; cycle < cycleCount; cycle++) {
    await Workspace.remove(`.advance-${cycle}`)
  }
}

const killStaleTask = async (Workspace: TestContext['Workspace']): Promise<void> => {
  const pid = await readPid(Workspace).catch(() => 0)
  if (pid && isAlive(pid)) {
    process.kill(pid, 'SIGKILL')
    await waitForExit(pid)
  }
}

export const setup = async ({ ActivityBar, Editor, Explorer, Panel, SideBar, Task, Terminal, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Terminal.killAll()
  await Panel.hide()
  await Workspace.setFiles([
    {
      content: tasksJson,
      name: '.vscode/tasks.json',
    },
    {
      content: watchScript,
      name: 'watch.mjs',
    },
    {
      content: 'line 1\nline 2\n',
      name: 'src/app.txt',
    },
  ])
  // Without the refresh, Run Task only offers "Configure a Task" for the new tasks.json.
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('.vscode')
  await SideBar.hide()
  // Wait until the task configuration has been picked up.
  await Task.openQuickPick({ item: taskLabel })
  await Task.hideQuickPick()
}

export const run = async ({ Panel, Problems, Task, Terminal, Workspace }: TestContext): Promise<void> => {
  await removeSignalFiles(Workspace)
  try {
    await Task.run(taskLabel, false)
    await Problems.shouldHaveCount(1)
    const pid = await readPid(Workspace)
    if (!isAlive(pid)) {
      throw new Error(`Expected background task process ${pid} to be running`)
    }
    for (let cycle = 1; cycle < cycleCount; cycle++) {
      await Workspace.add({ content: '', name: `.advance-${cycle}` })
      // The collector clears markers that a finished cycle did not report again.
      await Problems.shouldHaveCount(cycle % 2 === 0 ? 1 : 0)
    }
    await Task.terminate(taskLabel)
    await waitForExit(pid)
    await Task.shouldHaveNoRunningTasks()
  } finally {
    await Terminal.killAll()
    await Panel.hide()
    await killStaleTask(Workspace)
    await removeSignalFiles(Workspace)
  }
}

export const teardown = async ({ Editor, Panel, Terminal, Workspace }: TestContext): Promise<void> => {
  await Terminal.killAll()
  await Panel.hide()
  await killStaleTask(Workspace)
  await Workspace.setFiles([])
  await Editor.closeAll()
}
