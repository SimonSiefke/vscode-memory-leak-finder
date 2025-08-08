import { prepareHeapSnapshot } from '../src/parts/PrepareHeapSnapshot/PrepareHeapSnapshot.js'

async function analyzeCodeNode() {
  console.log('Analyzing code node 4825...')

  // Load the actual heap snapshot file
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/abc2.json'

  try {
    // Prepare the heap snapshot
    const snapshot = await prepareHeapSnapshot(heapSnapshotPath, {
      parseStrings: true,
    })

    console.log('Heap snapshot loaded successfully')
    console.log(`Snapshot has ${snapshot.node_count} nodes and ${snapshot.edge_count} edges`)

    const { nodes, edges, strings, meta } = snapshot
    const nodeFields = meta.node_fields
    const nodeTypes = meta.node_types
    const edgeFields = meta.edge_fields

    // Get field indices
    const typeFieldIndex = nodeFields.indexOf('type')
    const nameFieldIndex = nodeFields.indexOf('name')
    const idFieldIndex = nodeFields.indexOf('id')
    const selfSizeFieldIndex = nodeFields.indexOf('self_size')
    const edgeCountFieldIndex = nodeFields.indexOf('edge_count')

    const edgeTypeFieldIndex = edgeFields.indexOf('type')
    const edgeNameFieldIndex = edgeFields.indexOf('name_or_index')
    const edgeToNodeFieldIndex = edgeFields.indexOf('to_node')

    const ITEMS_PER_NODE = nodeFields.length
    const ITEMS_PER_EDGE = edgeFields.length

    // Helper function to parse a node from the flat array
    const parseNode = (nodeIndex) => {
      const nodeStart = nodeIndex * ITEMS_PER_NODE
      if (nodeStart >= nodes.length) {
        return null
      }

      const node = {}
      for (let i = 0; i < nodeFields.length; i++) {
        const fieldIndex = nodeStart + i
        if (fieldIndex < nodes.length) {
          node[nodeFields[i]] = nodes[fieldIndex]
        }
      }
      return node
    }

    // Helper function to get node name as string
    const getNodeName = (node) => {
      if (node.name !== undefined && strings[node.name]) {
        return strings[node.name]
      }
      return null
    }

    // Helper function to get node type name
    const getNodeTypeName = (node) => {
      if (nodeTypes[0] && Array.isArray(nodeTypes[0]) && node.type !== undefined) {
        return nodeTypes[0][node.type]
      }
      return null
    }

    // Find node with ID 4825
    let targetNode = null
    let targetNodeIndex = -1

    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
      const nodeId = nodes[nodeIndex + idFieldIndex]
      if (nodeId === 4825) {
        targetNode = parseNode(nodeIndex / ITEMS_PER_NODE)
        targetNodeIndex = nodeIndex / ITEMS_PER_NODE
        break
      }
    }

    if (!targetNode) {
      console.log('Node with ID 4825 not found!')
      return
    }

    console.log('\n=== Node 4825 Details ===')
    console.log(`ID: ${targetNode.id}`)
    console.log(`Type: ${getNodeTypeName(targetNode)}`)
    console.log(`Name: ${getNodeName(targetNode)}`)
    console.log(`Self Size: ${targetNode.self_size}`)
    console.log(`Edge Count: ${targetNode.edge_count}`)

    // Analyze edges from this node
    console.log('\n=== Edges from Node 4825 ===')
    let currentEdgeOffset = 0

    // Find the edge offset for this node
    for (let nodeIndex = 0; nodeIndex < targetNodeIndex * ITEMS_PER_NODE; nodeIndex += ITEMS_PER_NODE) {
      const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]
      currentEdgeOffset += edgeCount
    }

    // Scan this node's edges
    for (let j = 0; j < targetNode.edge_count; j++) {
      const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
      const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
      const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
      const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

      const edgeTypeName = meta.edge_types[0][edgeType] || `type_${edgeType}`
      const edgeName = strings[edgeNameIndex] || `<string_${edgeNameIndex}>`

      const targetNodeData = parseNode(edgeToNode)
      const targetNodeName = getNodeName(targetNodeData)
      const targetNodeType = getNodeTypeName(targetNodeData)

      console.log(`  Edge ${j + 1}:`)
      console.log(`    Type: ${edgeTypeName}`)
      console.log(`    Name: ${edgeName}`)
      console.log(`    To Node ID: ${targetNodeData?.id}`)
      console.log(`    To Node Type: ${targetNodeType}`)
      console.log(`    To Node Name: ${targetNodeName}`)
    }

    // Also check if this node is referenced by other nodes
    console.log('\n=== Nodes that reference Node 4825 ===')
    currentEdgeOffset = 0

    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += ITEMS_PER_NODE) {
      const edgeCount = nodes[nodeIndex + edgeCountFieldIndex]

      // Scan this node's edges
      for (let j = 0; j < edgeCount; j++) {
        const edgeIndex = (currentEdgeOffset + j) * ITEMS_PER_EDGE
        const edgeToNode = edges[edgeIndex + edgeToNodeFieldIndex]

        if (edgeToNode === targetNodeIndex) {
          const sourceNode = parseNode(nodeIndex / ITEMS_PER_NODE)
          const sourceNodeName = getNodeName(sourceNode)
          const sourceNodeType = getNodeTypeName(sourceNode)

          const edgeType = edges[edgeIndex + edgeTypeFieldIndex]
          const edgeNameIndex = edges[edgeIndex + edgeNameFieldIndex]
          const edgeTypeName = meta.edge_types[0][edgeType] || `type_${edgeType}`
          const edgeName = strings[edgeNameIndex] || `<string_${edgeNameIndex}>`

          console.log(`  Referenced by Node ${sourceNode.id}:`)
          console.log(`    Source Type: ${sourceNodeType}`)
          console.log(`    Source Name: ${sourceNodeName}`)
          console.log(`    Edge Type: ${edgeTypeName}`)
          console.log(`    Edge Name: ${edgeName}`)
        }
      }

      currentEdgeOffset += edgeCount
    }

  } catch (error) {
    console.error('Error analyzing code node:', error)
  }
}

// Run the analysis
analyzeCodeNode()
