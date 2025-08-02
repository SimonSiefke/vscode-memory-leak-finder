import { downloadAndBuildVscodeFromCommit } from '../DownloadAndBuildVscodeFromCommit/DownloadAndBuildVscodeFromCommit.js'

// Default values for backward compatibility
const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'
const DEFAULT_REPOS_DIR = '.vscode-repos'

// Wrapper function that provides default values
const downloadAndBuildVscodeFromCommitWithDefaults = async (commitRef) => {
  return downloadAndBuildVscodeFromCommit(commitRef, DEFAULT_REPO_URL, DEFAULT_REPOS_DIR)
}

export const commandMap = {
  'Repository.downloadAndBuildVscodeFromCommit': downloadAndBuildVscodeFromCommitWithDefaults,
}
