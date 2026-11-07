const vscode = require('vscode')
const fs = require('node:fs/promises')
const path = require('node:path')

// Readers poll these files while commands run. Publish only complete JSON.
const publishJson = async (file, records) => {
  const temporary = `${file}.tmp`
  await fs.writeFile(temporary, JSON.stringify(records))
  await fs.rename(temporary, file)
}

exports.activate = (context) => {
  const parent = path.resolve(context.extensionPath, '../../../../.vscode-test-workspace')
  let root
  const prefix = 'Chat window lifecycle '
  const commands = {
    async create() {
      const records = []
      for (const transient of [true, false]) {
        const terminal = vscode.window.createTerminal({
          name: `${prefix}${transient ? 'transient' : 'persistent'}`,
          shellPath: '/bin/bash',
          shellArgs: ['--noprofile', '--norc'],
          cwd: root,
          isTransient: transient,
          location: { viewColumn: vscode.ViewColumn.Active, preserveFocus: false },
        })
        terminal.show(false)
        let timer
        let pid
        try {
          pid = await Promise.race([
            terminal.processId,
            new Promise((_, reject) => {
              timer = setTimeout(() => reject(new Error('No terminal PID within 10 seconds')), 10_000)
            }),
          ])
        } finally {
          clearTimeout(timer)
        }
        if (!Number.isInteger(pid) || pid <= 0) throw new Error(`No real shell PID for ${terminal.name}`)
        records.push({ name: terminal.name, pid, transient })
      }
      await publishJson(path.join(root, '.chat-window-terminals.json'), records)
    },
    async snapshot() {
      const records = []
      for (const terminal of vscode.window.terminals) {
        records.push({ name: terminal.name, pid: await terminal.processId })
      }
      await publishJson(path.join(root, '.chat-window-terminal-snapshot.json'), records)
    },
    async verifyReconnect() {
      const matches = vscode.window.terminals.filter((terminal) => terminal.name === `${prefix}persistent`)
      if (matches.length !== 1) throw new Error(`Expected one reattached persistent terminal, found ${matches.length}`)
      matches[0].sendText(`printf '%s\\n' "$$" > .chat-window-reconnected-pid`)
    },
    async cleanup() {
      for (const terminal of vscode.window.terminals) {
        if (terminal.name.startsWith(prefix)) terminal.dispose()
      }
    },
  }
  for (const [stage, command] of Object.entries(commands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`chatWindowTerminalProbe.${stage}`, async () => {
        try {
          root = (await fs.readFile(path.join(parent, '.chat-window-fixture-root'), 'utf8')).trim()
          if (!root.startsWith(parent + path.sep)) throw new Error('Fixture workspace must be isolated')
          await command()
          void vscode.window.showInformationMessage(`Chat Window Terminal Probe: ${stage} complete`)
        } catch (error) {
          void vscode.window.showErrorMessage(`Chat Window Terminal Probe: ${stage} failed: ${error}`)
        }
      }),
    )
  }
}
