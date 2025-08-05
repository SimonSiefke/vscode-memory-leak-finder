import { test, expect } from '@jest/globals'
import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../src/parts/GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.js'
import * as LoadHeapSnapshot from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'

test('analyzesRealHeapSnapshot', async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'

  // Load the real heap snapshot
  await LoadHeapSnapshot.loadHeapSnapshot(heapSnapshotPath)

  // Run prototype chain analysis
  console.log('Running prototype chain analysis on real heap snapshot...')
  const analysis = await GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot(heapSnapshotPath)

  console.log('=== PROTOTYPE CHAIN ANALYSIS RESULTS ===')
  console.log('Long prototype chains found:', analysis.longPrototypeChains.length)
  console.log('Prototype pollution found:', analysis.prototypePollution.length)
  console.log('Statistics:', analysis.prototypeStatistics)

  if (analysis.longPrototypeChains.length > 0) {
    console.log('\n=== LONG PROTOTYPE CHAINS ===')
    analysis.longPrototypeChains.slice(0, 3).forEach((chain, i) => {
      console.log(`Chain ${i + 1}:`)
      console.log(`  Node: ${chain.nodeName} (ID: ${chain.nodeId})`)
      console.log(`  Length: ${chain.chainLength}`)
      console.log(`  Chain: ${chain.prototypeChain.map((p) => p.nodeName).join(' -> ')}`)
      if (chain.suspiciousProperties.length > 0) {
        console.log(`  Suspicious properties: ${chain.suspiciousProperties.length}`)
      }
    })
  }

  if (analysis.prototypePollution.length > 0) {
    console.log('\n=== PROTOTYPE POLLUTION ===')
    analysis.prototypePollution.slice(0, 5).forEach((pollution, i) => {
      console.log(`Pollution ${i + 1}:`)
      console.log(`  Property: ${pollution.propertyName}`)
      console.log(`  Prototype: ${pollution.prototypeName}`)
      console.log(`  Affected objects: ${pollution.affectedObjectCount}`)
      console.log(`  Severity: ${pollution.severity}`)
    })
  }

  if (analysis.suspiciousPatterns.securityIssues.length > 0) {
    console.log('\n=== SECURITY ISSUES ===')
    console.log('Critical security-related prototype pollution detected!')
    analysis.suspiciousPatterns.securityIssues.forEach((issue) => {
      console.log(`  - ${issue.propertyName} affects ${issue.affectedObjectCount} objects`)
    })
  }

  if (analysis.suspiciousPatterns.performanceIssues.length > 0) {
    console.log('\n=== PERFORMANCE ISSUES ===')
    console.log('Very long prototype chains detected (20+ levels):')
    analysis.suspiciousPatterns.performanceIssues.forEach((issue) => {
      console.log(`  - ${issue.nodeName}: ${issue.chainLength} levels`)
    })
  }

  if (analysis.suspiciousPatterns.possibleFrameworkIssue.length > 0) {
    console.log('\n=== POSSIBLE FRAMEWORK ISSUES ===')
    console.log('Component/Mixin inheritance chains:')
    analysis.suspiciousPatterns.possibleFrameworkIssue.forEach((issue) => {
      console.log(`  - ${issue.nodeName}: ${issue.chainLength} levels`)
    })
  }

  // Basic assertions to ensure analysis ran
  expect(analysis).toBeDefined()
  expect(analysis.prototypeStatistics).toBeDefined()
  expect(analysis.longPrototypeChains).toBeInstanceOf(Array)
  expect(analysis.prototypePollution).toBeInstanceOf(Array)
  expect(analysis.suspiciousPatterns).toBeDefined()

  // The analysis should at least find some objects to analyze
  expect(analysis.prototypeStatistics.average).toBeGreaterThanOrEqual(0)

  // Clean up
  HeapSnapshotState.dispose(heapSnapshotPath)
}, 30000) // 30 second timeout for loading large file
