import { getObjectsWithPropertiesInternal } from '../src/parts/GetObjectsWithPropertiesInternal/GetObjectsWithPropertiesInternal.ts'
import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

async function testGetObjectsWithProperties() {
  console.log('Testing getObjectsWithProperties function...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    console.log('\n=== Testing Refactored Function ===')
    const oldStateObjects = getObjectsWithPropertiesInternal(snapshot, 'oldState')
    console.log(`Refactored function found ${oldStateObjects.length} objects with "oldState" property`)

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
    console.log('\n=== Looking for Object 37129 ===')
    const targetObject = oldStateObjects.find((obj) => obj.id === 37129)
    if (targetObject) {
      console.log('✅ Found object 37129:')
      console.log(`  ID: ${targetObject.id}`)
      console.log(`  Name: ${targetObject.name}`)
      console.log(`  Property Value: ${targetObject.propertyValue}`)
      console.log(`  Type: ${targetObject.type}`)
      console.log(`  Self Size: ${targetObject.selfSize}`)
      console.log(`  Edge Count: ${targetObject.edgeCount}`)
    } else {
      console.log('❌ Object 37129 not found (due to corrupted edge data)')
    }

    // Additional debugging (keeping for reference)
    console.log('\n=== Additional Analysis ===')
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
      console.log('This is likely due to the corrupted edge data (node index 124278 is out of bounds)')
      console.log('The edge should point to node index 20713 (node ID 41727) instead of 124278')

      // Let's test the getObjectsWithPropertiesInternal function with debugging
      console.log('\nDebugging getObjectsWithPropertiesInternal function...')

      // Import the functions we need for debugging
      const { createEdgeMap } = await import('../src/parts/CreateEdgeMap/CreateEdgeMap.ts')
      const { getNodeEdges } = await import('../src/parts/GetNodeEdges/GetNodeEdges.ts')

      const edgeMap = createEdgeMap(snapshot.nodes, snapshot.meta.node_fields)

      // Find the actual node index for object 37129
      let object37129NodeIndex = -1
      const nodeFieldLength = snapshot.meta.node_fields.length
      for (let i = 0; i < snapshot.nodes.length; i += nodeFieldLength) {
        const id = snapshot.nodes[i + 2]
        if (id === 37129) {
          object37129NodeIndex = i / nodeFieldLength
          break
        }
      }

      if (object37129NodeIndex !== -1) {
        console.log(`Object 37129 found at node index: ${object37129NodeIndex}`)
        console.log(`Edge map for this node: ${edgeMap[object37129NodeIndex]}`)

        const nodeEdges = getNodeEdges(
          object37129NodeIndex,
          edgeMap,
          snapshot.nodes,
          snapshot.edges,
          snapshot.meta.node_fields,
          snapshot.meta.edge_fields,
        )
        console.log(`getNodeEdges returned ${nodeEdges.length} edges:`)
        nodeEdges.forEach((edge, i) => {
          const edgeTypeName = snapshot.meta.edge_types[0][edge.type] || 'unknown'
          const propertyName = snapshot.strings[edge.nameIndex] || edge.nameIndex.toString()
          console.log(`  Edge ${i + 1}: type=${edgeTypeName}, name="${propertyName}", toNode=${edge.toNode}`)

          if (edge.type === 2 && snapshot.strings[edge.nameIndex] === 'oldState') {
            console.log(`    This is the oldState edge! toNode=${edge.toNode}`)
            if (edge.toNode >= snapshot.nodes.length / nodeFieldLength) {
              console.log(
                `    ERROR: toNode ${edge.toNode} is out of bounds (max: ${Math.floor(snapshot.nodes.length / nodeFieldLength) - 1})`,
              )
            }
          }
        })
      }

      // Continue with the rest of the analysis
      console.log('\nContinuing with detailed object analysis...')
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

            if (edgeType === 2) {
              // property edge
              propertyName = snapshot.strings[nameOrIndex] || 'unknown'
            } else {
              propertyName = nameOrIndex.toString()
            }

            console.log(
              `  Edge ${i + 1}: index=${edgeIndex}, type=${edgeTypeName}(${edgeType}), name="${propertyName}"(${nameOrIndex}), to_node=${toNode}`,
            )

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
                    console.log(
                      `    Node 41727 details: type=${nodeType}, name=${nodeName}("${snapshot.strings[nodeName]}"), size=${selfSize}`,
                    )
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
