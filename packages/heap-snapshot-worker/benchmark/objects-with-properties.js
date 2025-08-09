import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.json'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    const oldStateObjects = getObjectsWithPropertiesInternal(snapshot, 'oldState')

    console.log(`Found ${oldStateObjects.length} objects with "oldState" property:`)

    // Debug: Let's also check if string "oldState" exists in the strings array
    const oldStateStringIndex = snapshot.strings.findIndex(str => str === 'oldState')
    console.log(`String "oldState" found at index: ${oldStateStringIndex}`)
    if (oldStateStringIndex === -1) {
      console.log('ERROR: String "oldState" not found in strings array!')
      console.log('Available strings containing "state":', snapshot.strings.filter(str => str && str.toLowerCase().includes('state')))
    }
    oldStateObjects.forEach((obj, index) => {
      console.log(`  Object ${index + 1}:`)
      console.log(`    ID: ${obj.id}`)
      console.log(`    Name: ${obj.name}`)
      console.log(`    Property Value: ${obj.propertyValue}`)
      console.log(`    Type: ${obj.type}`)
      console.log(`    Self Size: ${obj.selfSize}`)
      console.log(`    Edge Count: ${obj.edgeCount}`)
    })

    // Look specifically for object 37129
    console.log('\nLooking specifically for object 37129...')
    const targetObject = oldStateObjects.find(obj => obj.id === 37129)
    if (targetObject) {
      console.log('Found object 37129:')
      console.log(`  ID: ${targetObject.id}`)
      console.log(`  Name: ${targetObject.name}`)
      console.log(`  Property Value: ${targetObject.propertyValue}`)
      console.log(`  Type: ${targetObject.type}`)
      console.log(`  Self Size: ${targetObject.selfSize}`)
      console.log(`  Edge Count: ${targetObject.edgeCount}`)
    } else {
      console.log('Object 37129 not found in objects with "oldState" property')

      // Let's also check if object 37129 exists at all in the snapshot
      console.log('\nChecking if object 37129 exists in the snapshot...')
      const nodeFields = snapshot.meta.node_fields
      const nodeFieldLength = nodeFields.length
      let found = false

      for (let i = 0; i < snapshot.nodes.length; i += nodeFieldLength) {
        const id = snapshot.nodes[i + 2] // id is at index 2 in node_fields
        if (id === 37129) {
          const type = snapshot.nodes[i + 0]
          const name = snapshot.nodes[i + 1]
          const selfSize = snapshot.nodes[i + 3]
          const edgeCount = snapshot.nodes[i + 4]

          console.log(`Found object 37129 in snapshot:`)
          console.log(`  Type: ${type} (${snapshot.meta.node_types[0][type] || 'unknown'})`)
          console.log(`  Name: ${name} (string: "${snapshot.strings[name] || 'unknown'}")`)
          console.log(`  ID: ${id}`)
          console.log(`  Self Size: ${selfSize}`)
          console.log(`  Edge Count: ${edgeCount}`)
          found = true
          break
        }
      }

      if (!found) {
        console.log('Object 37129 does not exist in the snapshot')
      } else {
        // Let's examine the properties of object 37129
        console.log('\nExamining properties of object 37129...')

        // Find the node index for object 37129
        let nodeIndex = -1
        for (let i = 0; i < snapshot.nodes.length; i += nodeFieldLength) {
          const id = snapshot.nodes[i + 2]
          if (id === 37129) {
            nodeIndex = i / nodeFieldLength
            break
          }
        }

        if (nodeIndex !== -1) {
          const edgeCount = snapshot.nodes[nodeIndex * nodeFieldLength + 4]
          console.log(`Object 37129 has ${edgeCount} edges`)

          // Find the starting edge index for this node
          let currentEdgeIndex = 0
          for (let i = 0; i < nodeIndex; i++) {
            currentEdgeIndex += snapshot.nodes[i * nodeFieldLength + 4]
          }

          const edgeFieldLength = snapshot.meta.edge_fields.length
          console.log(`Starting edge index: ${currentEdgeIndex}`)

          // Check the raw edge data around our position
          console.log(`Raw edge data at starting position:`)
          for (let i = 0; i < Math.min(15, snapshot.edges.length - currentEdgeIndex * edgeFieldLength); i++) {
            console.log(`  edges[${currentEdgeIndex * edgeFieldLength + i}] = ${snapshot.edges[currentEdgeIndex * edgeFieldLength + i]}`)
          }

          // Examine each edge from this node
          for (let i = 0; i < edgeCount; i++) {
            const edgeIndex = (currentEdgeIndex + i) * edgeFieldLength
            const edgeType = snapshot.edges[edgeIndex + 0]
            const nameOrIndex = snapshot.edges[edgeIndex + 1]
            const toNode = snapshot.edges[edgeIndex + 2]

            const edgeTypeName = snapshot.meta.edge_types[0][edgeType] || 'unknown'
            let propertyName = ''

            if (edgeType === 2) { // property edge
              propertyName = snapshot.strings[nameOrIndex] || 'unknown'
            } else {
              propertyName = nameOrIndex.toString()
            }

            console.log(`  Edge ${i + 1}: index=${edgeIndex}, type=${edgeTypeName}(${edgeType}), name="${propertyName}"(${nameOrIndex}), to_node=${toNode}`)

            // Check if this is an oldState property
            if (edgeType === 2 && snapshot.strings[nameOrIndex] === 'oldState') {
              console.log(`    *** This is the oldState property! ***`)
              console.log(`    Points to node index ${toNode}`)

              // Check if the node index is valid
              if (toNode >= snapshot.nodes.length / nodeFieldLength) {
                console.log(`    ERROR: Node index ${toNode} is out of bounds!`)
                console.log(`    This suggests the edge data might be corrupted or misaligned`)

                // Let's search for node ID 41727 directly to see if it exists
                console.log(`    Searching for node with ID 41727...`)
                let foundNode41727 = false
                for (let i = 0; i < snapshot.nodes.length; i += nodeFieldLength) {
                  const nodeId = snapshot.nodes[i + 2]
                  if (nodeId === 41727) {
                    const nodeIndex = i / nodeFieldLength
                    console.log(`    Found node 41727 at index ${nodeIndex}`)
                    foundNode41727 = true

                    // Check if this node has a name or value that makes sense
                    const nodeType = snapshot.nodes[i + 0]
                    const nodeName = snapshot.nodes[i + 1]
                    const selfSize = snapshot.nodes[i + 3]
                    console.log(`    Node 41727 details: type=${nodeType}, name=${nodeName}("${snapshot.strings[nodeName]}"), size=${selfSize}`)
                    break
                  }
                }

                if (!foundNode41727) {
                  console.log(`    Node ID 41727 does not exist in this snapshot`)
                }
              } else {
                // Get the target node details
                const targetNodeData = snapshot.nodes.slice(toNode * nodeFieldLength, (toNode + 1) * nodeFieldLength)
                const targetId = targetNodeData[2]
                console.log(`    Target node ID: ${targetId}`)
                console.log(`    Expected target ID: 41727`)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error testing getObjectsWithProperties:', error)
  }
}

// Run the test
testGetObjectsWithProperties()
