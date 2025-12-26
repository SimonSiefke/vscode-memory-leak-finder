import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractMethodInfo } from './generateApiTypes/ExtractMethodInfo.ts'
import { extractProperties } from './generateApiTypes/ExtractProperties.ts'
import { generateInterfaceFromMethods } from './generateApiTypes/GenerateInterface.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const generateApiTypes = async (): Promise<void> => {
  const pageObjectDir = resolve(__dirname, '../../page-object/src/parts')
  const partsFile = join(pageObjectDir, 'Parts', 'Parts.ts')
  const outputFile = resolve(__dirname, '../../e2e/types/pageobject-api.d.ts')

  try {
    // Read the Parts.ts file to get all part names
    const partsContent = readFileSync(partsFile, 'utf8')
    const partNames = partsContent
      .split('\n')
      .filter((line) => line.includes('export * as'))
      .map((line) => {
        const match = line.match(/export \* as (\w+) from/)
        return match ? match[1] : null
      })
      .filter(Boolean) as string[]

    let interfaces: string[] = []
    let apiProperties: string[] = []

    // Process each part
    for (const partName of partNames) {
      // Try the exact name first, then try variations (e.g., ExtensionDetailView -> ExtensionsDetailView)
      let partFile = join(pageObjectDir, partName, `${partName}.ts`)
      let found = false

      // Check if file exists, if not try variations
      try {
        readFileSync(partFile, 'utf8')
        found = true
      } catch {
        // Try adding 's' to Extension (e.g., ExtensionDetailView -> ExtensionsDetailView)
        const alternativeName = partName.replace(/^Extension([A-Z])/, 'Extensions$1')
        if (alternativeName !== partName) {
          const alternativeFile = join(pageObjectDir, alternativeName, `${alternativeName}.ts`)
          try {
            readFileSync(alternativeFile, 'utf8')
            partFile = alternativeFile
            found = true
          } catch {
            // Try other variations if needed
          }
        }
      }

      if (!found) {
        // @ts-ignore
        console.warn(`Warning: Could not find file for ${partName}, adding as 'any' type`)
        apiProperties.push(`${partName}: any`)
        continue
      }

      try {
        const content = readFileSync(partFile, 'utf8')
        const methods = extractMethodInfo(content)
        const properties = extractProperties(content)

        if (methods.length > 0 || properties.length > 0) {
          const interfaceDef = generateInterfaceFromMethods(methods, properties, partName)
          interfaces.push(interfaceDef)
          apiProperties.push(`${partName}: ${partName}`)
        } else {
          // Even if no methods/properties, add it as 'any' type
          apiProperties.push(`${partName}: any`)
        }
      } catch (error) {
        // @ts-ignore
        console.warn(`Warning: Could not process ${partFile}:`, error.message)
        // Still add it to the API as 'any' type
        apiProperties.push(`${partName}: any`)
      }
    }

    // Generate the main API interface
    const mainApiInterface = `export interface PageObjectApi {\n${apiProperties.map((prop) => `  readonly ${prop}`).join('\n')}\n}`

    // Generate context interface
    const contextInterface = `export interface PageObjectContext {
  page: any
  expect: any
  VError: any
  ideVersion?: {
    minor: number
  }
  electronApp?: any
}`

    // Combine all interfaces
    const allInterfaces = [
      '// Generated API types for page-object',
      '// This file provides type definitions for the page-object API used in e2e tests',
      '',
      contextInterface,
      '',
      ...interfaces,
      '',
      mainApiInterface,
      '',
      '// Export the create function type',
      'export declare const create: (context: PageObjectContext) => Promise<PageObjectApi>',
      '',
      'export default PageObjectApi',
    ].join('\n')

    // Ensure the output directory exists
    const outputDir = resolve(__dirname, '../../e2e/types')
    const { mkdirSync } = await import('node:fs')
    try {
      mkdirSync(outputDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write the generated types to the output file
    writeFileSync(outputFile, allInterfaces, 'utf8')

    console.log(`✅ Generated API types at: ${outputFile}`)
    console.log(`📊 Generated ${interfaces.length} interfaces from page-object parts`)
  } catch (error) {
    console.error('❌ Failed to generate API types:', error)
    throw error
  }
}
