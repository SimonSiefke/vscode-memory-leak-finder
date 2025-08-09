import fs from 'fs'

const testFile = 'test/GetObjectsWithPropertiesInternal.test.ts'
const content = fs.readFileSync(testFile, 'utf-8')

// Fix all the test expectations to use preview instead of properties
let updatedContent = content

// Replace all properties blocks with preview blocks
// Pattern: properties: { propertyName: { name: "...", type: "...", value: "..." } }
// Convert to: preview: { propertyName: "..." }
const propertiesRegex = /properties:\s*{\s*([^}]+)\s*}/g

updatedContent = updatedContent.replace(propertiesRegex, (match, content) => {
  // Extract individual property definitions
  const propertyPattern = /(\w+):\s*{\s*name:\s*"[^"]*",\s*type:\s*"[^"]*",\s*value:\s*("[^"]*")\s*}/g
  
  const properties = []
  let propertyMatch
  while ((propertyMatch = propertyPattern.exec(content)) !== null) {
    const [, propertyName, value] = propertyMatch
    properties.push(`${propertyName}: ${value}`)
  }
  
  return `preview: {\n      ${properties.join(',\n      ')}\n    }`
})

fs.writeFileSync(testFile, updatedContent)
console.log('Fixed test expectations in', testFile)
