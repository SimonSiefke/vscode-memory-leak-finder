import { readFileSync, writeFileSync } from 'fs'

// Read the test file
const testFile = 'test/GetObjectsWithPropertiesInternal.test.ts'
let content = readFileSync(testFile, 'utf8')

// Define the edge index fixes needed
// Format: [oldValue, newValue, context]
const edgeFixes = [
  // Simple property edges to code objects (node index 1 -> array index 7)
  ['2, 1, 1,  // property edge from Object1 to code object', '2, 1, 7,  // property edge from Object1 to code object (array index 7 = node index 1 * 7 fields)'],
  
  // Internal edges to various targets (node index 2 -> array index 14)  
  ['3, 0, 2,  // internal edge from code object to string "hello"', '3, 0, 14, // internal edge from code object to string "hello" (array index 14 = node index 2 * 7 fields)'],
  ['3, 0, 2,  // internal edge from code object to number 42', '3, 0, 14, // internal edge from code object to number 42 (array index 14 = node index 2 * 7 fields)'],
  ['3, 0, 2,  // internal edge from code object to object', '3, 0, 14, // internal edge from code object to object (array index 14 = node index 2 * 7 fields)'],
  ['3, 0, 2,  // internal edge from code object to array', '3, 0, 14, // internal edge from code object to array (array index 14 = node index 2 * 7 fields)'],
  ['3, 0, 2,  // internal edge from code object to string "internal"', '3, 0, 14, // internal edge from code object to string "internal" (array index 14 = node index 2 * 7 fields)'],
  
  // Incoming edges to code objects (node index 1 -> array index 7)
  ['3, 6, 1,  // incoming edge from array to code object with name "1"', '3, 6, 7,  // incoming edge from array to code object with name "1" (array index 7 = node index 1 * 7 fields)'],
  ['3, 7, 1,  // incoming edge from array to code object with name "2"', '3, 7, 7,  // incoming edge from array to code object with name "2" (array index 7 = node index 1 * 7 fields)'],
  ['3, 5, 1,  // incoming edge from array to code object with name "hello"', '3, 5, 7,  // incoming edge from array to code object with name "hello" (array index 7 = node index 1 * 7 fields)'],
  ['3, 6, 1,  // incoming edge from array to code object with name "incoming"', '3, 6, 7,  // incoming edge from array to code object with name "incoming" (array index 7 = node index 1 * 7 fields)'],
]

// Apply the fixes
edgeFixes.forEach(([oldPattern, newPattern]) => {
  content = content.replace(oldPattern, newPattern)
})

// Write the fixed content back
writeFileSync(testFile, content)

console.log('Fixed edge indices in test file')
console.log('Applied', edgeFixes.length, 'fixes')
