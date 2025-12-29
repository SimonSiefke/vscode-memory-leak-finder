import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from './parts/GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'

const main = async (): Promise<void> => {
  const root = join(import.meta.dirname, '../../..')
  const cacheDir = join(root, '.extension-source-maps-cache')
  const outputDir = join(root, '.extension-source-maps')

  await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
    extensionName: 'copilot-chat',
    version: '0.36.2025121004',
    repoUrl: 'git@github.com:microsoft/vscode-copilot-chat.git',
    outputDir,
    cacheDir,
  })
}

main()

