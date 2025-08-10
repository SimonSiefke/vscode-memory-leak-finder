import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'
import { parseNode } from '../src/parts/ParseNode/ParseNode.ts'
import { getActualValue } from '../src/parts/GetActualValue/GetActualValue.ts'
import { createEdgeMap } from '../src/parts/CreateEdgeMap/CreateEdgeMap.ts'

async function debugNumberNodes() {
  console.log('Debugging number nodes...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.heapsnapshot'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    // Look for the specific number nodes mentioned in the output
    const numberNodeIds = [45127, 45335, 45119, 45529, 45533, 45115, 45245, 45103, 45075, 45079, 45249, 45253, 33041, 45537]

    const { nodes, edges, strings, meta } = snapshot
    const nodeFields = meta.node_fields
    const nodeTypes = meta.node_types
    const edgeFields = meta.edge_fields

    const ITEMS_PER_NODE = nodeFields.length
    const ITEMS_PER_EDGE = edgeFields.length

    // Get field indices
    const idFieldIndex = nodeFields.indexOf('id')
    const typeFieldIndex = nodeFields.indexOf('type')
    const nameFieldIndex = nodeFields.indexOf('name')
    const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

    // Get node type names
    const nodeTypeNames = nodeTypes[0] || []
    const NODE_TYPE_NUMBER = nodeTypeNames.indexOf('number')

    console.log('NODE_TYPE_NUMBER index:', NODE_TYPE_NUMBER)

    // Create edge map for fast lookups
    const edgeMap = createEdgeMap(nodes, nodeFields)
    console.log('Edge map created for fast lookups')

    // Test the actual parsing by looking for the oldState object
    console.log('\n=== Testing actual parsing ===')
    let oldStateFound = false
    
    for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
      const node = parseNode(i, nodes, nodeFields)
      if (node && node.edge_count > 0) {
        // Look for edges that might lead to an oldState object
        let edgeOffset = 0
        for (let j = 0; j < i / ITEMS_PER_NODE; j++) {
          edgeOffset += nodes[j * ITEMS_PER_NODE + edgeCountFieldIndex]
        }
        
        for (let j = 0; j < Math.min(node.edge_count, 3); j++) {
          const edgeIndex = (edgeOffset + j) * ITEMS_PER_EDGE
          const edgeNameIndex = edges[edgeIndex + 1]
          const edgeName = strings[edgeNameIndex] || ''
          
          if (edgeName === 'oldState') {
            console.log(`Found oldState edge at node ${node.id}`)
            oldStateFound = true
            
            // Follow this edge to see the oldState object
            const edgeToNode = edges[edgeIndex + 2]
            const edgeToNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)
            const oldStateNode = parseNode(edgeToNodeIndex, nodes, nodeFields)
            
            if (oldStateNode && oldStateNode.edge_count > 0) {
              console.log('oldState object found, examining its properties...')
              
              // Get edges of oldState object
              let oldStateEdgeOffset = 0
              for (let k = 0; k < edgeToNodeIndex; k++) {
                oldStateEdgeOffset += nodes[k * ITEMS_PER_NODE + edgeCountFieldIndex]
              }
              
              const oldStateProps = {}
              for (let k = 0; k < Math.min(oldStateNode.edge_count, 10); k++) {
                const propEdgeIndex = (oldStateEdgeOffset + k) * ITEMS_PER_EDGE
                const propEdgeNameIndex = edges[propEdgeIndex + 1]
                const propEdgeToNode = edges[propEdgeIndex + 2]
                
                const propName = strings[propEdgeNameIndex] || 'unknown'
                const propNodeIndex = Math.floor(propEdgeToNode / ITEMS_PER_NODE)
                const propNode = parseNode(propNodeIndex, nodes, nodeFields)
                
                if (propNode) {
                  const actualValue = getActualValue(propNode, snapshot, edgeMap)
                  oldStateProps[propName] = actualValue
                }
              }
              
              console.log('Parsed oldState:', JSON.stringify(oldStateProps, null, 2))
              break
            }
          }
        }
        if (oldStateFound) break
      }
    }

    for (const nodeId of numberNodeIds) {
      console.log(`\n=== Examining node ${nodeId} ===`)

      // Find the node index for this target node
      let targetNodeIndex = -1
      for (let i = 0; i < nodes.length; i += ITEMS_PER_NODE) {
        if (nodes[i + idFieldIndex] === nodeId) {
          targetNodeIndex = i / ITEMS_PER_NODE
          break
        }
      }

      if (targetNodeIndex !== -1) {
        const node = parseNode(targetNodeIndex, nodes, nodeFields)
        console.log('Node:', {
          id: node.id,
          type: node.type,
          name: node.name,
          edgeCount: node.edge_count,
        })

        // Check if this is actually a number node
        if (node.type === NODE_TYPE_NUMBER) {
          console.log('✓ This is a number node')

          // Get the node name from strings array
          const nodeName = strings[node.name] || 'undefined'
          console.log('Node name from strings:', nodeName)

          // Check if the name is a valid number
          if (nodeName && !isNaN(Number(nodeName))) {
            console.log('✓ Node name is a valid number:', nodeName)
          } else {
            console.log('✗ Node name is not a valid number')
          }

          // Look at edges to see what this number node references
          if (node.edge_count > 0) {
            console.log(`Node has ${node.edge_count} edges`)

            // Find the edge offset for this node
            let edgeOffset = 0
            for (let i = 0; i < targetNodeIndex; i++) {
              edgeOffset += nodes[i * ITEMS_PER_NODE + edgeCountFieldIndex]
            }

            console.log('Edge offset:', edgeOffset)

            // Look at the first few edges
            for (let i = 0; i < Math.min(node.edge_count, 5); i++) {
              const edgeIndex = (edgeOffset + i) * ITEMS_PER_EDGE
              const edgeType = edges[edgeIndex]
              const edgeNameIndex = edges[edgeIndex + 1]
              const edgeToNode = edges[edgeIndex + 2]

              const edgeTypeName = meta.edge_types[0][edgeType] || 'unknown'
              const edgeName = strings[edgeNameIndex] || 'undefined'
              const edgeToNodeIndex = Math.floor(edgeToNode / ITEMS_PER_NODE)

              console.log(`  Edge ${i}: type=${edgeTypeName}(${edgeType}), name="${edgeName}", toNode=${edgeToNodeIndex}`)

              // If this is an internal edge, check what it points to
              if (edgeType === 3) { // internal edge type (3 in this snapshot)
                const referencedNode = parseNode(edgeToNodeIndex, nodes, nodeFields)
                if (referencedNode) {
                  const referencedTypeName = nodeTypeNames[referencedNode.type] || 'unknown'
                  const referencedName = strings[referencedNode.name] || 'undefined'
                  console.log(`    → References ${referencedTypeName} node: ${referencedName}`)
                  
                  // If this is a string node with a numeric value, that's what we want!
                  if (referencedTypeName === 'string' && !isNaN(Number(referencedName))) {
                    console.log(`    ✓ Found numeric string value: ${referencedName}`)
                  }
                }
              }
            }
          }
        } else {
          console.log('✗ This is NOT a number node')
        }
      } else {
        console.log('Node not found')
      }
    }
  } catch (error) {
    console.error('Error debugging number nodes:', error)
  }
}

// Run the debug
debugNumberNodes()
