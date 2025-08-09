import { join } from 'node:path'
import { getNamedMapCountFromHeapSnapshot } from '../src/parts/GetNamedMapCountFromHeapSnapshot/GetNamedMapCountFromHeapSnapshot.js'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testNamedMapCount = async () => {
  console.log('Testing Named Map Count:')

  try {
    const maps = await getNamedMapCountFromHeapSnapshot(filePath1)
    console.log(`Found ${maps.length} Map objects`)

    // Show first 10 maps as examples
    console.log('\nFirst 10 Map objects:')
    maps.slice(0, 10).forEach((map, index) => {
      console.log(`${index + 1}. ID: ${map.id}, Name: ${JSON.stringify(map.name)}, Size: ${map.size}`)
    })

    // Find the specific map mentioned in the requirements
    const map206045 = maps.find((map) => map.id === 206045)
    if (map206045) {
      console.log('\nMap with ID 206045:')
      console.log(JSON.stringify(map206045, null, 2))
    } else {
      console.log('\nMap with ID 206045 not found')
    }

    // Show some statistics
    const sizeStats = {}
    maps.forEach((map) => {
      sizeStats[map.size] = (sizeStats[map.size] || 0) + 1
    })

    console.log('\nMap size distribution (first 10):')
    Object.entries(sizeStats)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .slice(0, 10)
      .forEach(([size, count]) => {
        console.log(`Size ${size}: ${count} maps`)
      })
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const main = async () => {
  try {
    await testNamedMapCount()
  } catch (error) {
    console.error('Test failed:', error.message)
    process.exit(1)
  }
}

main()
