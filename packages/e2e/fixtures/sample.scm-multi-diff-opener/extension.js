const vscode = require('vscode')

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-memory-leak-finder.openScmMultiDiff', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0]
      if (!workspaceFolder) {
        throw new Error('Expected a workspace folder')
      }
      await vscode.commands.executeCommand('_workbench.openScmMultiDiffEditor', {
        title: 'Changes',
        repositoryUri: workspaceFolder.uri,
        resourceGroupId: 'workingTree',
      })
    }),
  )
}
