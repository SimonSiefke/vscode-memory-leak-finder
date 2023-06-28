export const getDefaultVsCodeSettings = () => {
  return {
    'git.openRepositoryInParentFolders': 'never',
    'window.titleBarStyle': 'custom',
    'files.watcherExclude': {
      '**/.git/objects/**': true,
      '**/.git/subtree-cache/**': true,
      '**/node_modules/*/**': true,
      '**/.hg/store/**': true,
      '**/.vscode-test-workspace/**': true,
      '**/.vscode-user-data-dir/**': true,
      '**/dist/**': true,
      '**/fixtures/**': true,
    },
  }
}
