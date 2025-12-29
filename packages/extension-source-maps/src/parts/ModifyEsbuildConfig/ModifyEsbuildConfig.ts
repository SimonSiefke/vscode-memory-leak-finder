import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'

export const modifyEsbuildConfig = async (repoPath: string): Promise<void> => {
  try {
    // Look for esbuild config files - common names: esbuild.js, esbuild.config.js, build.js, etc.
    const possibleConfigFiles = [
      'esbuild.js',
      'esbuild.config.js',
      'build.js',
      'scripts/build.js',
      'src/build.js',
    ]

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
      // Already has sourcemap config, modify it
      const modifiedContent = content
        .replace(/sourcemap:\s*false/gi, 'sourcemap: true')
        .replace(/sourceMap:\s*false/gi, 'sourceMap: true')
        .replace(/sourcemap:\s*['"]none['"]/gi, "sourcemap: 'inline'")
        .replace(/sourceMap:\s*['"]none['"]/gi, "sourceMap: 'inline'")
      
      if (modifiedContent !== content) {
        await writeFile(configPath, modifiedContent, 'utf8')
        return
      }
    }

    // Add sourcemap config if it doesn't exist
    // Try to find the build function call or config object
    if (content.includes('build(') || content.includes('buildSync(')) {
      // Try to add sourcemap to the first build options object
      // Match build({ ... }) and add sourcemap if not present
      const buildCallRegex = /(build(?:Sync)?\s*\(\s*\{)([^}]*?)(\})/s
      const match = content.match(buildCallRegex)
      if (match) {
        const before = match[1]
        const options = match[2]
        const after = match[3]
        
        if (!options.includes('sourcemap') && !options.includes('sourceMap')) {
          // Add sourcemap before the closing brace
          const lastComma = options.trim().endsWith(',') ? '' : ','
          const modifiedContent = content.replace(
            buildCallRegex,
            `${before}${options}${lastComma}\n    sourcemap: true,${after}`
          )
          await writeFile(configPath, modifiedContent, 'utf8')
          return
        }
      }
    }
    
    // Try to find export default or module.exports with a config object
    if (content.includes('export default') || content.includes('module.exports')) {
      // Look for a config object
      const configObjectRegex = /(export\s+default|module\.exports\s*=\s*)(\{[^}]*?)(\})/s
      const match = content.match(configObjectRegex)
      if (match) {
        const before = match[1]
        const config = match[2]
        const after = match[3]
        
        if (!config.includes('sourcemap') && !config.includes('sourceMap')) {
          const lastComma = config.trim().endsWith(',') ? '' : ','
          const modifiedContent = content.replace(
            configObjectRegex,
            `${before}${config}${lastComma}\n  sourcemap: true,${after}`
          )
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

