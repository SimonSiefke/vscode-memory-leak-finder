import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { VError } from '@lvce-editor/verror'

const CONFIG_FILE_REGEX = /--config\s+(\S+)/
const SOURCE_MAP_FALSE_REGEX = /sourceMap:\s*false/g
const SOURCE_MAP_FALSE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*false/gi
const SOURCE_MAP_NONE_REGEX = /sourceMap:\s*['"]none['"]/g
const SOURCE_MAP_NONE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*['"]none['"]/gi
const SOURCE_MAP_TRUE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*true/gi
const SOURCE_MAP_TRUE_REGEX = /sourceMap:\s*true/g
const BUILD_CALL_REGEX = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\n\s*\})\)/m
const SIMPLE_BUILD_REGEX = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\})/s
const INDENT_MATCH_REGEX = /\n(\s*)/
const CONFIG_OBJECT_REGEX = /(export\s+default|module\.exports\s*=\s*)(\{[\s\S]*?)(\n\s*\})/m
const SIMPLE_CONFIG_REGEX = /(export\s+default|module\.exports\s*=\s*)\s*(\{[\s\S]*?\n\s*\})/s

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

    // Check if sourcemap is already enabled
    if (content.includes('sourcemap:') || content.includes('sourceMap:')) {
      // Already has sourcemap config, modify it while preserving case
      // Match sourceMap (camelCase) first, then sourcemap (lowercase)
      let modifiedContent = content
        .replace(SOURCE_MAP_FALSE_REGEX, 'sourceMap: true')
        .replace(SOURCE_MAP_FALSE_CASE_INSENSITIVE_REGEX, 'sourcemap: true')
        .replace(SOURCE_MAP_NONE_REGEX, "sourceMap: 'inline'")
        .replace(SOURCE_MAP_NONE_CASE_INSENSITIVE_REGEX, "sourcemap: 'inline'")

      if (modifiedContent !== content) {
        await writeFile(configPath, modifiedContent, 'utf8')
        return
      }

      // Check if sourcemap is already true
      if (content.match(SOURCE_MAP_TRUE_CASE_INSENSITIVE_REGEX) || content.match(SOURCE_MAP_TRUE_REGEX)) {
        return
      }
    }

    // Add sourcemap config if it doesn't exist
    // Try to find the build function call or config object
    if (content.includes('build(') || content.includes('buildSync(')) {
      // Try to add sourcemap to the first build options object
      // Match build({ ... }) and add sourcemap if not present
      // Use a more sophisticated regex that handles nested objects
      let match = content.match(BUILD_CALL_REGEX)
      let buildRegex = BUILD_CALL_REGEX

      // If that doesn't match, try a simpler pattern
      if (!match) {
        match = content.match(SIMPLE_BUILD_REGEX)
        buildRegex = SIMPLE_BUILD_REGEX
      }

      if (match) {
        const before = match[1]
        const options = match[2]
        const after = match[3]

        if (!options.includes('sourcemap') && !options.includes('sourceMap')) {
          // Detect indentation from the options
          const indentMatch = options.match(INDENT_MATCH_REGEX)
          const indent = indentMatch ? indentMatch[1] : '  '
          // Add sourcemap before the closing brace
          const lastComma = options.trim().endsWith(',') || options.trim() === '' ? '' : ','
          const modifiedContent = content.replace(buildRegex, `${before}${options}${lastComma}\n${indent}sourcemap: true,${after}`)
          await writeFile(configPath, modifiedContent, 'utf8')
          return
        }
      }
    }

    // Try to find export default or module.exports with a config object
    if (content.includes('export default') || content.includes('module.exports')) {
      // Look for a config object - handle multi-line objects better
      let match = content.match(CONFIG_OBJECT_REGEX)
      let configRegex = CONFIG_OBJECT_REGEX

      // If that doesn't match, try a simpler pattern
      if (!match) {
        match = content.match(SIMPLE_CONFIG_REGEX)
        configRegex = SIMPLE_CONFIG_REGEX
      }

      if (match) {
        const before = match[1]
        let config = match[2]
        let after = match[3]

        // If config ends with }, extract the content before it
        if (config.endsWith('}')) {
          after = '}'
          config = config.slice(0, -1)
        }

        if (!config.includes('sourcemap') && !config.includes('sourceMap')) {
          // Detect indentation from the config
          const indentMatch = config.match(INDENT_MATCH_REGEX)
          const indent = indentMatch ? indentMatch[1] : '  '
          const lastComma = config.trim().endsWith(',') || config.trim() === '{' ? '' : ','
          const closingBrace = after || '}'
          const modifiedContent = content.replace(configRegex, `${before}${config}${lastComma}\n${indent}sourcemap: true${closingBrace}`)
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
