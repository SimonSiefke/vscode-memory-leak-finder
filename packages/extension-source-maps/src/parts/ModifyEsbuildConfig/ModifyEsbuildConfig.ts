import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'
import { getNewEsbuildConfig } from '../GetNewEsbuildConfig/GetNewEsbuildConfig.ts'
import * as ReadJson from '../ReadJson/ReadJson.ts'

const CONFIG_FILE_REGEX = /--config\s+(\S+)/

export const modifyEsbuildConfig = async (repoPath: string): Promise<void> => {
  try {
    // Look for esbuild config files - common names: esbuild.js, esbuild.config.js, build.js, etc.
    const possibleConfigFiles = ['.esbuild.ts', 'esbuild.js', 'esbuild.config.js', 'build.js', 'scripts/build.js', 'src/build.js']

    let configPath: string | undefined
    for (const configFile of possibleConfigFiles) {
      const fullPath = join(repoPath, configFile)
      try {
        await readFile(fullPath, 'utf8')
        configPath = fullPath
        break
      } catch {
        // File doesn't exist, try next
      }
    }

    if (!configPath) {
      // Try to find any .js file that might contain esbuild config
      const packageJsonPath = join(repoPath, 'package.json')
      const packageJsonContent = await readFile(packageJsonPath, 'utf8')
      const packageJson = JSON.parse(packageJsonContent)
      const scripts = packageJson.scripts || {}

      // Check if there's a build script that might reference a config
      const buildScript = scripts.compile || scripts.build
      if (buildScript && buildScript.includes('esbuild')) {
        // Try to extract config file from script
        const match = buildScript.match(CONFIG_FILE_REGEX)
        if (match) {
          const configFile = match[1]
          const fullPath = join(repoPath, configFile)
          try {
            await readFile(fullPath, 'utf8')
            configPath = fullPath
          } catch {
            // Config file doesn't exist
          }
        }
      }
    }

    if (!configPath) {
      throw new Error('Could not find esbuild config file')
    }

    const content = await readFile(configPath, 'utf8')
    const newContent = getNewEsbuildConfig(content)

    if (newContent !== content) {
      await writeFile(configPath, newContent, 'utf8')
    }
  } catch (error) {
    throw new VError(error, `Failed to modify esbuild config in '${repoPath}'`)
  }
}
