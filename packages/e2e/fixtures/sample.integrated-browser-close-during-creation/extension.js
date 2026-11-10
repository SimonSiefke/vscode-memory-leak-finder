const vscode = require('vscode')

const setup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
}
const run = async () => {
  let settled = false
  let closedWhilePending = false
  let close
  let timeout
  const closed = new Promise((resolve, reject) => {
    close = resolve
    timeout = setTimeout(() => reject(new Error('Browser editor did not open while creation was pending')), 7000)
  })
  const listener = vscode.window.tabGroups.onDidChangeTabs(async (event) => {
    if (!event.opened.length || settled) return
    closedWhilePending = true
    await vscode.window.tabGroups.close(event.opened)
    close()
  })
  try {
    const opening = vscode.window.openBrowserTab('about:blank').then(
      async (tab) => {
        settled = true
        await tab.close()
      },
      (error) => {
        settled = true
        if (!closedWhilePending) throw error
      },
    )
    await closed
    await opening
    if (!closedWhilePending) throw new Error('Early close did not overlap the creation request')
    if (vscode.window.browserTabs.length) throw new Error('Browser tab survived early close')
  } finally {
    clearTimeout(timeout)
    listener.dispose()
  }
}
const cleanup = async () => {
  for (const tab of vscode.window.browserTabs) await tab.close()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('integrated-browser-close-during-creation.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-close-during-creation.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Integrated Browser Close During Creation: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-close-during-creation.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Integrated Browser Close During Creation: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('integrated-browser-close-during-creation.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Integrated Browser Close During Creation: cleanup complete')
    }),
  )
}
