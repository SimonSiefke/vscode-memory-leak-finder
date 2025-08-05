import * as Path from '../Path/Path.js'
import * as Root from '../Root/Root.js'

export const DEFAULT_REPO_URL = 'https://github.com/microsoft/vscode.git'
export const DEFAULT_REPOS_DIR = Path.join(Root.root, '.vscode-repos')
export const DEFAULT_CACHE_DIR = Path.join(Root.root, '.vscode-node-modules')
export const DEFAULT_USE_NICE = false 