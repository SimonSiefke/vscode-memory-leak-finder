import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from './parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import { root } from './parts/Root/Root.ts'

const main = async (): Promise<void> => {
  const cacheDir = join(root, '.extension-source-maps-cache')

  await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
    cacheDir,
    extensionName: 'copilot-chat',
    repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
    version: 'v0.35.3',
  })
}

main()
