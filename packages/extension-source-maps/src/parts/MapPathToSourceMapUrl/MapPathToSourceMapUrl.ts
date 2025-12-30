import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export const mapPathToSourceMapUrl = (path: string, root: string): string | null => {
  if (!path) {
    return null
  }
  try {
    // Path might be: .vscode-extensions/github.copilot-chat-0.36.2025121004/dist/extension.js
    // or absolute path
    const absolutePath = path.startsWith('/') ? path : resolve(root, path)

    // Check if this is a copilot extension file
    const extensionMatch = absolutePath.match(/\.vscode-extensions\/(github\.copilot-chat-[^/]+)\/(.+)$/)
    if (!extensionMatch) {
      return null
    }
    const extensionId = extensionMatch[1]
    const relativePath = extensionMatch[2]

    // Map to source maps directory
    const sourceMapPath = join(root, '.extension-source-maps', extensionId, relativePath + '.map')
    if (!existsSync(sourceMapPath)) {
      console.log(`[addOriginalSourcesToData] Source map not found: ${sourceMapPath}`)
      return null
    }
    const sourceMapUrl = pathToFileURL(sourceMapPath).toString()
    return sourceMapUrl
  } catch {
    return null
  }
}

