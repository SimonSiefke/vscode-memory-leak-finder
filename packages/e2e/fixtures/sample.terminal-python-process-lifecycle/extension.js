const vscode = require('vscode')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')

let directory
let python
let journal
let iteration = 0

const waitFor = async (predicate, description) => {
  const deadline = Date.now() + 10000
  do {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 100))
  } while (Date.now() < deadline)
  throw new Error(`Timed out waiting for ${description}`)
}

const isAlive = (pid) => {
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    if (error.code === 'ESRCH') return false
    throw error
  }
}

const quote = (value) => (process.platform === 'win32' ? `'${value.replaceAll("'", "''")}'` : `'${value.replaceAll("'", "'\\''")}'`)

const setup = async (context) => {
  python = execFileSync(process.platform === 'win32' ? 'python' : 'python3', ['-c', 'import sys; print(sys.executable)'], {
    encoding: 'utf8',
    timeout: 10000,
  }).trim()
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'vscode-python-terminal-'))
  await fs.mkdir(context.logUri.fsPath, { recursive: true })
  journal = path.join(context.logUri.fsPath, 'process-lifecycle.jsonl')
  iteration = 0
}

const runCase = async (mode) => {
  const marker = path.join(directory, 'pid.json')
  let terminal
  let shellPid
  let pythonPid
  try {
    terminal = vscode.window.createTerminal({
      name: `Python lifecycle: ${mode}`,
      shellPath: process.platform === 'win32' ? 'powershell.exe' : '/bin/bash',
      shellArgs: process.platform === 'win32' ? ['-NoLogo', '-NoProfile', '-NoExit'] : ['--noprofile', '--norc'],
    })
    terminal.show(false)
    // Bound processId as well as process shutdown, so a failed launch cannot hang.
    void terminal.processId.then((pid) => {
      shellPid = pid
    })
    await waitFor(() => Number.isInteger(shellPid) && shellPid > 0, 'terminal shell PID')
    const args = [python, path.join(__dirname, 'main.py'), marker, mode].map(quote).join(' ')
    terminal.sendText(`${process.platform === 'win32' ? '& ' : ''}${args}`)
    await waitFor(async () => {
      try {
        const data = JSON.parse(await fs.readFile(marker, 'utf8'))
        assert.ok(Number.isInteger(data.pid) && data.pid > 0, 'Python must report a valid PID')
        pythonPid = data.pid
        return true
      } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return false
        throw error
      }
    }, 'Python script to start')
    if (mode === 'finished') {
      await waitFor(() => !isAlive(pythonPid), 'Python to exit normally')
      assert.ok(isAlive(shellPid), 'The interactive shell should remain alive until the terminal is killed')
    } else {
      assert.ok(isAlive(pythonPid), 'Python must still be running before the terminal is killed')
    }
    assert.equal(vscode.window.activeTerminal, terminal)
    await vscode.commands.executeCommand('workbench.action.terminal.kill')
    await waitFor(() => !vscode.window.terminals.includes(terminal), 'terminal close notification')
    await waitFor(() => !isAlive(shellPid) && !isAlive(pythonPid), 'shell and Python processes to exit after terminal close')
    await fs.appendFile(journal, `${JSON.stringify({ iteration, mode, shellPid, pythonPid, shellAlive: false, pythonAlive: false })}\n`)
  } finally {
    terminal?.dispose()
    // Only rescue fixture-owned processes after the assertions; never hide failed shutdown.
    for (const pid of [pythonPid, shellPid]) {
      try {
        if (pid && isAlive(pid)) process.kill(pid, 'SIGKILL')
      } catch (error) {
        if (error.code !== 'ESRCH') throw error
      }
    }
    await fs.rm(marker, { force: true })
  }
}

const cleanup = async () => {
  if (directory) await fs.rm(directory, { recursive: true, force: true })
  directory = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({ dispose: () => void cleanup() })
  for (const [stage, action] of Object.entries({
    setup: () => setup(context),
    run: async () => {
      iteration++
      await runCase('finished')
      await runCase('running')
    },
    cleanup,
  })) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`terminal-python-process-lifecycle.${stage}`, async () => {
        try {
          await action()
          void vscode.window.showInformationMessage(`Python Terminal Process Lifecycle: ${stage} complete`)
        } catch (error) {
          void vscode.window.showErrorMessage(`Python Terminal Process Lifecycle: ${stage} failed: ${error.message}`)
          throw error
        }
      }),
    )
  }
}
