import * as fs from 'fs'
import * as path from 'path'
import { getArraysByClosureLocationFromHeapSnapshot } from './src/parts/GetArraysByClosureLocationFromHeapSnapshot/GetArraysByClosureLocationFromHeapSnapshot.js'
import * as HeapSnapshotState from './src/parts/HeapSnapshotState/HeapSnapshotState.js'

async function testRealHeapSnapshot() {
  try {
    // Load the real heap snapshot
    const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'
    console.log('Loading heap snapshot from:', heapSnapshotPath)
    
    const heapSnapshotData = JSON.parse(fs.readFileSync(heapSnapshotPath, 'utf8'))
    
    // Set up the heap snapshot state
    const snapshotId = 'real-test-snapshot'
    HeapSnapshotState.set(snapshotId, heapSnapshotData)
    
    // Create a mock script map (in a real scenario, this would come from the source maps)
    const scriptMap = {}
    
    console.log('Analyzing arrays by closure location...')
    const result = await getArraysByClosureLocationFromHeapSnapshot(snapshotId, scriptMap)
    
    console.log(`\nFound ${result.length} closure locations with arrays:`)
    console.log('=' .repeat(80))
    
    // Display top 20 locations by total size
    const topLocations = result.slice(0, 20)
    
    topLocations.forEach((group, index) => {
      console.log(`\n${index + 1}. Location: ${group.locationKey}`)
      console.log(`   Count: ${group.count} arrays`)
      console.log(`   Total Size: ${group.totalSize.toLocaleString()} bytes`)
      console.log(`   Average Size: ${Math.round(group.avgSize).toLocaleString()} bytes`)
      console.log(`   Total Length: ${group.totalLength.toLocaleString()} elements`)
      console.log(`   Average Length: ${Math.round(group.avgLength).toLocaleString()} elements`)
      
      if (group.locationInfo) {
        console.log(`   Script ID: ${group.locationInfo.scriptId}`)
        console.log(`   Line: ${group.locationInfo.line}, Column: ${group.locationInfo.column}`)
        if (group.locationInfo.url) {
          console.log(`   URL: ${group.locationInfo.url}`)
        }
      } else {
        console.log(`   Location: Unknown`)
      }
      
      // Show some example arrays
      const sampleArrays = group.arrays.slice(0, 3)
      if (sampleArrays.length > 0) {
        console.log(`   Sample arrays:`)
        sampleArrays.forEach((arr, arrIndex) => {
          const name = Array.isArray(arr.name) ? arr.name.join(', ') : arr.name
          console.log(`     ${arrIndex + 1}. ID: ${arr.id}, Name: "${name}", Length: ${arr.length}, Size: ${arr.selfSize} bytes`)
        })
        if (group.arrays.length > 3) {
          console.log(`     ... and ${group.arrays.length - 3} more arrays`)
        }
      }
    })
    
    // Summary statistics
    const totalArrays = result.reduce((sum, group) => sum + group.count, 0)
    const totalSize = result.reduce((sum, group) => sum + group.totalSize, 0)
    const totalLength = result.reduce((sum, group) => sum + group.totalLength, 0)
    
    console.log('\n' + '=' .repeat(80))
    console.log('SUMMARY:')
    console.log(`Total closure locations: ${result.length}`)
    console.log(`Total arrays: ${totalArrays.toLocaleString()}`)
    console.log(`Total memory used: ${totalSize.toLocaleString()} bytes`)
    console.log(`Total array elements: ${totalLength.toLocaleString()}`)
    console.log(`Average arrays per location: ${(totalArrays / result.length).toFixed(1)}`)
    console.log(`Average size per location: ${Math.round(totalSize / result.length).toLocaleString()} bytes`)
    
    // Clean up
    HeapSnapshotState.dispose(snapshotId)
    
  } catch (error) {
    console.error('Error analyzing heap snapshot:', error)
  }
}

testRealHeapSnapshot() 