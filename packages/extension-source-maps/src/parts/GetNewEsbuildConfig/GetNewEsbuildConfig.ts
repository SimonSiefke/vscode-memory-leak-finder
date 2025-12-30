const SOURCE_MAP_FALSE_REGEX = /sourceMap:\s*false/g
const SOURCE_MAP_FALSE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*false/gi
const SOURCE_MAP_NONE_REGEX = /sourceMap:\s*['"]none['"]/g
const SOURCE_MAP_NONE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*['"]none['"]/gi
const SOURCE_MAP_TRUE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*true/gi
const SOURCE_MAP_TRUE_REGEX = /sourceMap:\s*true/g
const SOURCE_MAP_ISDEV_LINKED_FALSE_REGEX = /sourceMap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/g
const SOURCE_MAP_ISDEV_LINKED_FALSE_CASE_INSENSITIVE_REGEX = /sourcemap:\s*isDev\s*\?\s*['"]linked['"]\s*:\s*false/gi
const BUILD_CALL_REGEX = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\n\s*\})\)/m
const SIMPLE_BUILD_REGEX = /(build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\})/s
const INDENT_MATCH_REGEX = /\n(\s*)/
const CONFIG_OBJECT_REGEX = /(export\s+default|module\.exports\s*=\s*)(\{[\s\S]*?)(\n\s*\})/m
const SIMPLE_CONFIG_REGEX = /(export\s+default|module\.exports\s*=\s*)\s*(\{[\s\S]*?\n\s*\})/s
const TYPE_ANNOTATED_CONFIG_REGEX = /(export\s+default|module\.exports\s*=\s*)\s*(\{[\s\S]*?\})\s*:\s*BuildOptions/ms
const MULTILINE_BUILD_REGEX = /((?:esbuild\.|\.)build(?:Sync)?\s*\(\s*\{)([\s\S]*?)(\}\))/s

export const getNewEsbuildConfig = (oldConfig: string): string => {
  // Check if sourcemap is already enabled
  if (oldConfig.includes('sourcemap:') || oldConfig.includes('sourceMap:')) {
    // Already has sourcemap config, modify it while preserving case
    // Match sourceMap (camelCase) first, then sourcemap (lowercase)
    let modifiedContent = oldConfig
      .replace(SOURCE_MAP_ISDEV_LINKED_FALSE_REGEX, "sourceMap: isDev ? 'linked' : 'linked'")
      .replace(SOURCE_MAP_ISDEV_LINKED_FALSE_CASE_INSENSITIVE_REGEX, "sourcemap: isDev ? 'linked' : 'linked'")
      .replace(SOURCE_MAP_FALSE_REGEX, 'sourceMap: true')
      .replace(SOURCE_MAP_FALSE_CASE_INSENSITIVE_REGEX, 'sourcemap: true')
      .replace(SOURCE_MAP_NONE_REGEX, "sourceMap: 'inline'")
      .replace(SOURCE_MAP_NONE_CASE_INSENSITIVE_REGEX, "sourcemap: 'inline'")

    if (modifiedContent !== oldConfig) {
      return modifiedContent
    }

    // Check if sourcemap is already true
    if (oldConfig.match(SOURCE_MAP_TRUE_CASE_INSENSITIVE_REGEX) || oldConfig.match(SOURCE_MAP_TRUE_REGEX)) {
      return oldConfig
    }
  }

  // Add sourcemap config if it doesn't exist
  // Try to find the build function call or config object
  if (oldConfig.includes('build(') || oldConfig.includes('buildSync(') || oldConfig.includes('.build(') || oldConfig.includes('.buildSync(')) {
    // Try to add sourcemap to the first build options object
    // Match build({ ... }) and add sourcemap if not present
    // Use a more sophisticated regex that handles nested objects
    let match = oldConfig.match(MULTILINE_BUILD_REGEX)
    let buildRegex = MULTILINE_BUILD_REGEX

    // If that doesn't match, try other patterns
    if (!match) {
      match = oldConfig.match(BUILD_CALL_REGEX)
      buildRegex = BUILD_CALL_REGEX
    }

    if (!match) {
      match = oldConfig.match(SIMPLE_BUILD_REGEX)
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
        const modifiedContent = oldConfig.replace(buildRegex, `${before}${options}${lastComma}\n${indent}sourcemap: true,${after}`)
        return modifiedContent
      }
    }
  }

  // Try to find export default or module.exports with a config object
  if (oldConfig.includes('export default') || oldConfig.includes('module.exports')) {
    // Look for a config object - handle multi-line objects better
    let match = oldConfig.match(CONFIG_OBJECT_REGEX)
    let configRegex = CONFIG_OBJECT_REGEX

    // If that doesn't match, try a simpler pattern
    if (!match) {
      match = oldConfig.match(SIMPLE_CONFIG_REGEX)
      configRegex = SIMPLE_CONFIG_REGEX
    }

    // Try TypeScript type-annotated config
    if (!match) {
      match = oldConfig.match(TYPE_ANNOTATED_CONFIG_REGEX)
      configRegex = TYPE_ANNOTATED_CONFIG_REGEX
    }

    if (match) {
      const before = match[1]
      let config = match[2]
      let after = match[3] || ''

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
        const modifiedContent = oldConfig.replace(configRegex, `${before}${config}${lastComma}\n${indent}sourcemap: true${closingBrace}`)
        return modifiedContent
      }
    }
  }

  // Last resort: try to find any object literal that looks like an esbuild config
  // Look for objects with common esbuild properties
  const esbuildPropertyPatterns = ['entryPoints', 'bundle', 'outfile', 'outdir', 'format', 'platform', 'target']
  const hasEsbuildProperties = esbuildPropertyPatterns.some((prop) => oldConfig.includes(prop))

  if (hasEsbuildProperties) {
    // Try to find object literals that look like esbuild configs
    // Match objects that are likely to be the main config (have multiple esbuild properties)
    const objectLiteralRegex = /(\{[\s\S]*?)(\n\s*\})/g
    let bestMatch: { match: RegExpMatchArray; score: number } | null = null
    let match: RegExpMatchArray | null

    // Reset regex lastIndex to avoid issues with global regex
    objectLiteralRegex.lastIndex = 0

    while ((match = objectLiteralRegex.exec(oldConfig)) !== null) {
      const objContent = match[1]
      // Check if this object has esbuild properties and doesn't have sourcemap
      if (!objContent.includes('sourcemap') && !objContent.includes('sourceMap')) {
        // Score based on how many esbuild properties it has
        const score = esbuildPropertyPatterns.filter((prop) => objContent.includes(prop)).length
        // Prefer objects with at least 2 esbuild properties
        if (score >= 2 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { match, score }
        }
      }
    }

    if (bestMatch) {
      const before = bestMatch.match[1]
      const after = bestMatch.match[2]
      const indentMatch = before.match(INDENT_MATCH_REGEX)
      const indent = indentMatch ? indentMatch[1] : '  '
      const lastComma = before.trim().endsWith(',') || before.trim() === '{' ? '' : ','
      const modifiedContent = oldConfig.replace(bestMatch.match[0], `${before}${lastComma}\n${indent}sourcemap: true${after}`)
      return modifiedContent
    }
  }

  // If we couldn't modify automatically, throw an error
  throw new Error(`Could not automatically modify esbuild config. Please add sourcemap: true manually.`)
}

