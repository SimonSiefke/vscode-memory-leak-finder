import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'

export const modifyEsbuildConfig = async (repoPath: string): Promise<void> => {
  try {
    // Look for esbuild config files - common names: esbuild.js, esbuild.config.js, build.js, etc.
    const possibleConfigFiles = ['esbuild.js', 'esbuild.config.js', 'build.js', 'scripts/build.js', 'src/build.js']

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
        const match = buildScript.match(/--config\s+(\S+)/)
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

    // Check if sourcemap is already enabled
    if (content.includes('sourcemap:') || content.includes('sourceMap:')) {
      // Detect which case is used (sourcemap or sourceMap)
      const usesCamelCase = content.includes('sourceMap:')
      
      // Already has sourcemap config, modify it
      let modifiedContent = content
        .replace(/sourcemap:\s*false/gi, usesCamelCase ? 'sourceMap: true' : 'sourcemap: true')
        .replace(/sourceMap:\s*false/gi, 'sourceMap: true')
        .replace(/sourcemap:\s*['"]none['"]/gi, usesCamelCase ? "sourceMap: 'inline'" : "sourcemap: 'inline'")
        .replace(/sourceMap:\s*['"]none['"]/gi, "sourceMap: 'inline'")

      if (modifiedContent !== content) {
        await writeFile(configPath, modifiedContent, 'utf8')
        return
      }
      
      // Check if sourcemap is already true
      if (content.match(/sourcemap:\s*true/gi) || content.match(/sourceMap:\s*true/gi)) {
        return
      }
    }

    // Add sourcemap config if it doesn't exist
    // Try to find the build function call or config object
    if (content.includes('build(') || content.includes('buildSync(')) {
      // Try to add sourcemap to the first build options object
      // Match build({ ... }) and add sourcemap if not present
      // Use a more sophisticated regex that handles nested objects
      const buildCallRegex = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\n\s*\})\)/m
      let match = content.match(buildCallRegex)
      
      // If that doesn't match, try a simpler pattern
      if (!match) {
        const simpleBuildRegex = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\})/s
        match = content.match(simpleBuildRegex)
      }
      
      if (match) {
        const before = match[1]
        const options = match[2]
        const after = match[3]

        if (!options.includes('sourcemap') && !options.includes('sourceMap')) {
          // Detect indentation from the options
          const indentMatch = options.match(/\n(\s*)/)
          const indent = indentMatch ? indentMatch[1] : '  '
          // Add sourcemap before the closing brace
          const lastComma = options.trim().endsWith(',') || options.trim() === '' ? '' : ','
          const modifiedContent = content.replace(buildCallRegex, `${before}${options}${lastComma}\n${indent}sourcemap: true,${after}`)
          await writeFile(configPath, modifiedContent, 'utf8')
          return
        }
      }
    }

    // Try to find export default or module.exports with a config object
    if (content.includes('export default') || content.includes('module.exports')) {
      // Look for a config object - handle multi-line objects better
      const configObjectRegex = /(export\s+default|module\.exports\s*=\s*)(\{[\s\S]*?)(\n\s*\})/m
      let match = content.match(configObjectRegex)
      
      // If that doesn't match, try a simpler pattern
      if (!match) {
        const simpleConfigRegex = /(export\s+default|module\.exports\s*=\s*)(\{[\s\S]*?)(\})/s
        match = content.match(simpleConfigRegex)
      }
      
      if (match) {
        const before = match[1]
        const config = match[2]
        const after = match[3]

        if (!config.includes('sourcemap') && !config.includes('sourceMap')) {
          // Detect indentation from the config
          const indentMatch = config.match(/\n(\s*)/)
          const indent = indentMatch ? indentMatch[1] : '  '
          const lastComma = config.trim().endsWith(',') || config.trim() === '{' ? '' : ','
          const modifiedContent = content.replace(configObjectRegex, `${before}${config}${lastComma}\n${indent}sourcemap: true,${after}`)
          await writeFile(configPath, modifiedContent, 'utf8')
          return
        }
      }
    }

    // If we couldn't modify automatically, throw an error
    throw new Error(`Could not automatically modify esbuild config at ${configPath}. Please add sourcemap: true manually.`)
  } catch (error) {
    throw new VError(error, `Failed to modify esbuild config in '${repoPath}'`)
  }
}
