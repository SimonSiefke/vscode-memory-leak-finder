import * as Assert from '@lvce-editor/assert'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import * as GenerateExtensionSourceMaps from '../GenerateExtensionSourceMaps/GenerateExtensionSourceMaps.ts'
import { root } from '../Root/Root.ts'

interface ResolveExtensionSourceMapConfig {
  readonly extensionName: string
  readonly repoUrl: string
  readonly cacheDir: string
  readonly platform: string
  readonly match: string
  readonly buildScript: readonly string[]
  readonly moditications: readonly any[]
  readonly pathReplacements: readonly any[]
}

const resolveVersion = (extensionpath: string) => {
  const packageJsonPath = join(extensionpath, 'package.json')
  console.log({ extensionpath })
  if (!existsSync(packageJsonPath)) {
    throw new Error(`package json not found`)
  }
  const packageJsonContent = readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)
  const { version } = packageJson
  if (!version) {
    throw new Error(`version not found in package json`)
  }
  return version
}

const getFinalPath = (relative: string, version: string, config: ResolveExtensionSourceMapConfig) => {
  let currentRelative = relative
  for (const replacement of config.pathReplacements) {
    currentRelative = currentRelative.replace(replacement.occurrence, replacement.replacement)
  }
  const finalPath = join(root, '.extension-source-maps-cache', config.extensionName + '-' + version, currentRelative)
  return finalPath
}

export const resolveExtensionSourceMap = async (
  uri: string,
  root: string,
  configs: readonly ResolveExtensionSourceMapConfig[],
): Promise<string> => {
  Assert.string(uri)
  Assert.string(root)
  Assert.array(configs)

  for (const config of configs) {
    const index = uri.indexOf(config.match)
    if (index === -1) {
      continue
    }
    const extensionFolder = uri.slice(0, index + config.match.length)
    const version = resolveVersion(extensionFolder)
    await GenerateExtensionSourceMaps.generateExtensionSourceMaps({
      cacheDir: config.cacheDir,
      extensionName: config.extensionName,
      repoUrl: config.repoUrl,
      version: version,
      buildScript: config.buildScript,
      platform: config.platform,
      modifications: config.moditications,
    })
    const relative = uri.slice(index + config.match.length)
    const finalPath = getFinalPath(relative, version, config)
    if (!existsSync(finalPath)) {
      throw new Error(`Source map not found`)
    }
    console.log({ finalPath })
    return finalPath
  }
  return ''
}
