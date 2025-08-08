import { readFileSync } from 'fs'
import { join } from 'path'
import { getObjectsWithProperties, getDisposables } from '../src/parts/GetObjectsWithProperties/GetObjectsWithProperties.js'

// Read the heap snapshot file
const heapSnapshotPath = join(import.meta.dirname, '../../../.vscode-heapsnapshots/abc2.json')
console.log('Reading heap snapshot from:', heapSnapshotPath)

// Read the file as a string
const fileContent = readFileSync(heapSnapshotPath, 'utf8')
console.log('File size:', fileContent.length, 'characters')

// Parse the JSON to get the structure
const heapSnapshot = JSON.parse(fileContent)

console.log('\n=== TESTING getObjectsWithProperties ===')

// Test with "abcdef" property
console.log('\n--- Testing "abcdef" property ---')
const abcdefObjects = getObjectsWithProperties(heapSnapshot, 'abcdef')
console.log(`Found ${abcdefObjects.length} objects with "abcdef" property:`)
abcdefObjects.forEach((obj, index) => {
  console.log(`  ${index + 1}. ID: ${obj.id}, Name: "${obj.name}", Type: ${obj.type}, Property Value: ${obj.propertyValue}`)
})

// Test with "dispose" property
console.log('\n--- Testing "dispose" property ---')
const disposeObjects = getObjectsWithProperties(heapSnapshot, 'dispose')
console.log(`Found ${disposeObjects.length} objects with "dispose" property:`)
disposeObjects.forEach((obj, index) => {
  console.log(`  ${index + 1}. ID: ${obj.id}, Name: "${obj.name}", Type: ${obj.type}, Property Value: ${obj.propertyValue}`)
})

// Test with "disposed" property
console.log('\n--- Testing "disposed" property ---')
const disposedObjects = getObjectsWithProperties(heapSnapshot, 'disposed')
console.log(`Found ${disposedObjects.length} objects with "disposed" property:`)
disposedObjects.forEach((obj, index) => {
  console.log(`  ${index + 1}. ID: ${obj.id}, Name: "${obj.name}", Type: ${obj.type}, Property Value: ${obj.propertyValue}`)
})

// Test with non-existent property
console.log('\n--- Testing non-existent property ---')
const nonExistentObjects = getObjectsWithProperties(heapSnapshot, 'nonexistentproperty')
console.log(`Found ${nonExistentObjects.length} objects with "nonexistentproperty" property`)

console.log('\n=== TESTING getDisposables ===')
const disposables = getDisposables(heapSnapshot)
console.log(`Dispose count: ${disposables.disposeCount}`)
console.log(`Disposed count: ${disposables.disposedCount}`)
console.log('Dispose objects:', disposables.dispose.length)
console.log('Disposed objects:', disposables.disposed.length)

console.log('\n=== TEST COMPLETE ===')
