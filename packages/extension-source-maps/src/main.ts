import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from './parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import { root } from './parts/Root/Root.ts'

const main = async (): Promise<void> => {
  const cacheDir = join(root, '.extension-source-maps-cache')
  const outputDir = join(root, '.extension-source-maps')

  await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
    extensionName: 'copilot-chat',
    version: 'v0.36.2025121901',
    repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
    outputDir,
    cacheDir,
  })
}

main()
