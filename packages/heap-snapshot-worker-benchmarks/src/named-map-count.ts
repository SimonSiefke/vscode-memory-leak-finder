import { join } from 'node:path'
import { importHeapSnapshotWorker } from './import-heap-snapshot-worker.ts'

const filePath1 = join(import.meta.dirname, '../../../.vscode-heapsnapshots/0.heapsnapshot')

const testNamedMapCount = async (): Promise<void> => {
  const { getNamedMapCountFromHeapSnapshot } = await importHeapSnapshotWorker(
    'parts/GetNamedMapCountFromHeapSnapshot/GetNamedMapCountFromHeapSnapshot.ts',
  )
  console.log('Testing Named Map Count:')

  try {
    const maps = await getNamedMapCountFromHeapSnapshot(filePath1)
    console.log(`Found ${maps.length} Map objects`)

    // Show first 10 maps as examples
    console.log('\nFirst 10 Map objects:')
    for (const [index, map] of maps.slice(0, 10).entries()) {
      console.log(`${index + 1}. ID: ${map.id}, Name: ${JSON.stringify(map.name)}, Size: ${map.size}`)
    }

    // Find the specific map mentioned in the requirements
    const map206045 = maps.find((map: { id: number }) => map.id === 206_045)
    if (map206045) {
      console.log('\nMap with ID 206045:')
      console.log(JSON.stringify(map206045, null, 2))
    } else {
      console.log('\nMap with ID 206045 not found')
    }

    // Show some statistics
    const sizeStats: Record<number, number> = {}
    for (const map of maps) {
      sizeStats[map.size] = (sizeStats[map.size] || 0) + 1
    }

    console.log('\nMap size distribution (first 10):')
    for (const [size, count] of Object.entries(sizeStats)
      .sort((a, b) => Number.parseInt(a[0]) - Number.parseInt(b[0]))
      .slice(0, 10)) {
      console.log(`Size ${size}: ${count} maps`)
    }
  } catch (error) {
    console.error('Error:', (error as Error).message)
  }
}

const main = async (): Promise<void> => {
  try {
    await testNamedMapCount()
  } catch (error) {
    console.error('Test failed:', (error as Error).message)
    process.exit(1)
  }
}

main()
