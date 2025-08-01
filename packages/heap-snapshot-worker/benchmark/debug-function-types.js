import { createReadStream } from 'node:fs'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

const debugHeapSnapshot = async (filePath) => {
  console.log(`\n=== Debugging Heap Snapshot: ${filePath} ===`)

  const readStream = createReadStream(filePath)
  const { metaData, nodes, locations } = await prepareHeapSnapshot(readStream)

  const { node_types, node_fields } = metaData.data.meta
  console.log('\nNode types available:')
  node_types[0].forEach((type, index) => {
    console.log(`  ${index}: ${type}`)
  })

  console.log('\nNode fields:')
  node_fields.forEach((field, index) => {
    console.log(`  ${index}: ${field}`)
  })

  // Count nodes by type
  const typeCounts = {}
  for (let i = 0; i < nodes.length; i += 7) {
    const typeIndex = nodes[i]
    const typeName = node_types[0][typeIndex]
    typeCounts[typeName] = (typeCounts[typeName] || 0) + 1
  }

  console.log('\nNode counts by type:')
  Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`)
    })

  console.log(`\nTotal locations: ${locations.length / 4}`)
  console.log(`Total nodes: ${nodes.length / 7}`)
}

const main = async () => {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('Usage: node debug-function-types.js <heap-snapshot-file>')
    process.exit(1)
  }

  const filePath = args[0]

  try {
    await debugHeapSnapshot(filePath)
  } catch (error) {
    console.error('Debug failed:', error.message)
    process.exit(1)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}