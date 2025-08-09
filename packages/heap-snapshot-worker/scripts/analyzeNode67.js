#!/usr/bin/env node

import { analyzeNodeFromFile } from '../src/parts/ExamineNode/ExamineNode.ts'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  const filePath = process.argv[2]
  const nodeId = parseInt(process.argv[3]) || 67

  if (!filePath) {
    console.log('Usage: node scripts/analyzeNode67.js <heapsnapshot-file> [nodeId]')
    console.log('Example: node scripts/analyzeNode67.js abc2.heapsnapshot 67')
    process.exit(1)
  }

  console.log(`Analyzing node ID ${nodeId} from ${filePath}...`)
  console.log('=' .repeat(60))

  const result = await analyzeNodeFromFile(filePath, nodeId)

  if (!result) {
    console.log(`Node with ID ${nodeId} not found in heap snapshot`)
    return
  }

  console.log(`Node Index: ${result.nodeIndex}`)
  console.log(`Node ID: ${result.nodeId}`)
  console.log(`Node Name: ${result.nodeName}`)
  console.log(`Node Type: ${result.nodeType}`)
  console.log(`Self Size: ${result.node.self_size}`)
  console.log(`Edge Count: ${result.node.edge_count}`)
  console.log(`Detachedness: ${result.node.detachedness}`)

  console.log('\n' + '=' .repeat(60))
  console.log('EDGES:')
  console.log('=' .repeat(60))

  if (result.edges.length === 0) {
    console.log('No edges found')
  } else {
    result.edges.forEach((edge, index) => {
      console.log(`\nEdge ${index}:`)
      console.log(`  Type: ${edge.typeName} (${edge.type})`)
      console.log(`  Name: ${edge.edgeName}`)
      console.log(`  To Node: ${edge.toNode}`)
      if (edge.targetNodeInfo) {
        console.log(`  Target: ${edge.targetNodeInfo.type} "${edge.targetNodeInfo.name}"`)
      }
    })
  }

  console.log('\n' + '=' .repeat(60))
  console.log('PROPERTIES:')
  console.log('=' .repeat(60))

  if (result.properties.length === 0) {
    console.log('No properties found')
  } else {
    result.properties.forEach((prop, index) => {
      const valueDisplay = prop.value?.startsWith('[undefined ') ? `**${prop.value}**` : prop.value
      console.log(`${prop.name} = ${valueDisplay} (${prop.targetType})`)
    })
  }

  // Check if this could be an undefined value
  if (result.nodeName === 'undefined' || result.nodeType === 'undefined') {
    console.log('\n' + '!' .repeat(60))
    console.log('*** THIS APPEARS TO BE AN UNDEFINED VALUE! ***')
    console.log('!' .repeat(60))
  }

  // Additional analysis for object properties
  console.log('\n' + '=' .repeat(60))
  console.log('EDGE TYPE ANALYSIS:')
  console.log('=' .repeat(60))

  const propertyEdges = result.edges.filter(edge => edge.typeName === 'property')
  const internalEdges = result.edges.filter(edge => edge.typeName === 'internal')
  const contextEdges = result.edges.filter(edge => edge.typeName === 'context')
  const elementEdges = result.edges.filter(edge => edge.typeName === 'element')
  const hiddenEdges = result.edges.filter(edge => edge.typeName === 'hidden')
  const shortcutEdges = result.edges.filter(edge => edge.typeName === 'shortcut')
  const weakEdges = result.edges.filter(edge => edge.typeName === 'weak')

  console.log(`Property edges: ${propertyEdges.length}`)
  console.log(`Internal edges: ${internalEdges.length}`)
  console.log(`Context edges: ${contextEdges.length}`)
  console.log(`Element edges: ${elementEdges.length}`)
  console.log(`Hidden edges: ${hiddenEdges.length}`)
  console.log(`Shortcut edges: ${shortcutEdges.length}`)
  console.log(`Weak edges: ${weakEdges.length}`)
}

main().catch(console.error)
