import * as GetPrototypeChainAnalysisFromHeapSnapshot from '../src/parts/GetPrototypeChainAnalysisFromHeapSnapshot/GetPrototypeChainAnalysisFromHeapSnapshot.js'
import * as LoadHeapSnapshot from '../src/parts/LoadHeapSnapshot/LoadHeapSnapshot.js'
import * as HeapSnapshotState from '../src/parts/HeapSnapshotState/HeapSnapshotState.js'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const analyzeHeapSnapshotPrototypeChains = async () => {
  const heapSnapshotPath = '/home/simon/.cache/repos/vscode-memory-leak-finder/.vscode-heapsnapshots/0.json'
  const outputPath = join(process.cwd(), 'prototype-chain-analysis-results.json')

  console.log('Loading heap snapshot...')
  await LoadHeapSnapshot.loadHeapSnapshot(heapSnapshotPath)

  console.log('Running prototype chain analysis...')
  const analysis = await GetPrototypeChainAnalysisFromHeapSnapshot.getPrototypeChainAnalysisFromHeapSnapshot(heapSnapshotPath)

  console.log('Analysis complete! Writing results to disk...')

  // Create a comprehensive report
  const report = {
    metadata: {
      timestamp: new Date().toISOString(),
      heapSnapshotPath,
      analysisType: 'prototype-chain-analysis'
    },
    summary: {
      totalObjectsAnalyzed: analysis.prototypeStatistics.count,
      longPrototypeChainsFound: analysis.longPrototypeChains.length,
      prototypePollutionFound: analysis.prototypePollution.length,
      statisticalOverview: analysis.prototypeStatistics
    },
    longPrototypeChains: analysis.longPrototypeChains,
    prototypePollution: analysis.prototypePollution,
    suspiciousPatterns: analysis.suspiciousPatterns,
    detailedStatistics: analysis.prototypeStatistics,
    objectDetails: analysis.detailedResults
  }

  await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('✅ Analysis complete!')
  console.log(`📊 Results saved to: ${outputPath}`)
  console.log('\n=== SUMMARY ===')
  console.log(`Objects analyzed: ${report.summary.totalObjectsAnalyzed}`)
  console.log(`Long prototype chains: ${report.summary.longPrototypeChainsFound}`)
  console.log(`Prototype pollution issues: ${report.summary.prototypePollutionFound}`)
  console.log(`Average chain length: ${report.summary.statisticalOverview.average.toFixed(2)}`)
  console.log(`Max chain length: ${report.summary.statisticalOverview.max}`)
  console.log(`95th percentile: ${report.summary.statisticalOverview.percentile95}`)

  if (report.summary.longPrototypeChainsFound > 0) {
    console.log('\n🚨 LONG PROTOTYPE CHAINS DETECTED:')
    report.longPrototypeChains.slice(0, 5).forEach((chain, i) => {
      console.log(`  ${i + 1}. ${chain.nodeName} (length: ${chain.chainLength})`)
    })
  }

  if (report.summary.prototypePollutionFound > 0) {
    console.log('\n🔐 PROTOTYPE POLLUTION DETECTED:')
    report.prototypePollution.slice(0, 5).forEach((pollution, i) => {
      console.log(`  ${i + 1}. ${pollution.propertyName} on ${pollution.prototypeName} (affects ${pollution.affectedObjectCount} objects)`)
    })
  }

  if (report.suspiciousPatterns.securityIssues.length > 0) {
    console.log('\n⚠️  SECURITY ISSUES DETECTED!')
  }

  if (report.suspiciousPatterns.performanceIssues.length > 0) {
    console.log('\n⚡ PERFORMANCE ISSUES DETECTED!')
  }

  // Clean up
  HeapSnapshotState.dispose(heapSnapshotPath)
}

// Run the analysis
analyzeHeapSnapshotPrototypeChains().catch(console.error)