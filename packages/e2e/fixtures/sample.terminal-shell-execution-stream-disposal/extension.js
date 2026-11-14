const vscode = require('vscode')

let terminal
let iteration = 0
let oldSetting
const setup = async () => {
  oldSetting = vscode.workspace.getConfiguration('terminal.integrated').inspect('shellIntegration.enabled')?.workspaceValue
  await vscode.workspace
    .getConfiguration('terminal.integrated')
    .update('shellIntegration.enabled', true, vscode.ConfigurationTarget.Workspace)
  let listener
  let timeout
  const ready = new Promise((resolve, reject) => {
    listener = vscode.window.onDidChangeTerminalShellIntegration((event) => {
      if (event.terminal === terminal) resolve()
    })
    timeout = setTimeout(() => reject(new Error('Bash shell integration did not initialize')), 7000)
  })
  try {
    terminal = vscode.window.createTerminal({ name: 'Shell stream lifecycle', shellPath: '/bin/bash' })
    terminal.show(true)
    await ready
  } finally {
    clearTimeout(timeout)
    listener.dispose()
  }
}
const run = async () => {
  const marker = `lifecycle-stream-${++iteration}`
  const execution = terminal.shellIntegration.executeCommand(`printf '${marker}\\n'`)
  let listener
  let timeout
  const ended = new Promise((resolve, reject) => {
    listener = vscode.window.onDidEndTerminalShellExecution((event) => {
      if (event.execution === execution) resolve(event.exitCode)
    })
    timeout = setTimeout(() => reject(new Error('Shell execution did not complete')), 7000)
  })
  try {
    let output = ''
    for await (const data of execution.read()) output += data
    const exitCode = await ended
    if (exitCode !== 0 || !output.includes('lifecycle-stream'))
      throw new Error(`Shell stream failed: exit=${exitCode}, output=${JSON.stringify(output)}`)
  } finally {
    clearTimeout(timeout)
    listener.dispose()
  }
}
const cleanup = async () => {
  terminal?.dispose()
  terminal = undefined
  await vscode.workspace
    .getConfiguration('terminal.integrated')
    .update('shellIntegration.enabled', oldSetting, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-shell-execution-stream-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-shell-execution-stream-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Shell Execution Stream Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-shell-execution-stream-disposal.run', async () => {
      try {
        await run()
      } catch (error) {
        void vscode.window.showInformationMessage(String(error))
        throw error
      }
      void vscode.window.showInformationMessage('Terminal Shell Execution Stream Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-shell-execution-stream-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Shell Execution Stream Disposal: cleanup complete')
    }),
  )
}
