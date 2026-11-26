const vscode = require('vscode')

let scm
let changed
let oldSelection
let oldSetting
let iteration = 0
class LateArtifactArgument {
  constructor(value) {
    this.value = value
  }
}
const setup = async () => {
  oldSelection = vscode.workspace.getConfiguration('scm.repositories').inspect('selectionMode')?.workspaceValue
  await vscode.workspace.getConfiguration('scm.repositories').update('selectionMode', 'single', vscode.ConfigurationTarget.Workspace)
  oldSetting = vscode.workspace.getConfiguration('scm.repositories').inspect('explorer')?.workspaceValue
  await vscode.workspace.getConfiguration('scm.repositories').update('explorer', true, vscode.ConfigurationTarget.Workspace)
  await vscode.commands.executeCommand('workbench.view.scm')
  await vscode.commands.executeCommand('workbench.scm.repositories.focus')
}
const run = async () => {
  const current = ++iteration
  let ready
  let timeout
  const delivered = new Promise((resolve, reject) => {
    ready = resolve
    timeout = setTimeout(() => reject(new Error('Artifact request did not enter provider')), 7000)
  })
  changed = new vscode.EventEmitter()
  scm = vscode.scm.createSourceControl(`late-artifacts-${current}`, 'Lifecycle artifacts')
  scm.artifactProvider = {
    onDidChangeArtifacts: changed.event,
    provideArtifactGroups: () => [{ id: 'lifecycle', name: 'Lifecycle artifact group' }],
    async provideArtifacts() {
      scm.dispose()
      scm = undefined
      await vscode.commands.executeCommand('setContext', 'scm-artifact-late-disposal.disposed', current)
      ready()
      return [
        {
          id: `artifact-${current}`,
          name: 'Late artifact',
          command: { command: 'scm-artifact-late-disposal.noop', title: 'Late artifact', arguments: [new LateArtifactArgument(current)] },
        },
      ]
    },
  }
  await vscode.commands.executeCommand('workbench.scm.repositories.focus')
  try {
    await delivered
    await vscode.commands.executeCommand('setContext', 'scm-artifact-late-disposal.delivered', current)
  } finally {
    clearTimeout(timeout)
    scm?.dispose()
    scm = undefined
    changed.dispose()
    changed = undefined
  }
}
const cleanup = async () => {
  await vscode.workspace.getConfiguration('scm.repositories').update('selectionMode', oldSelection, vscode.ConfigurationTarget.Workspace)
  scm?.dispose()
  scm = undefined
  changed?.dispose()
  changed = undefined
  await vscode.workspace.getConfiguration('scm.repositories').update('explorer', oldSetting, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('scm-artifact-late-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('scm-artifact-late-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Scm Artifact Late Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('scm-artifact-late-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Scm Artifact Late Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('scm-artifact-late-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Scm Artifact Late Disposal: cleanup complete')
    }),
  )
}
