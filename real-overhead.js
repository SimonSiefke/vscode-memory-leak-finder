// WHAT IS THE ACTUAL OVERHEAD?

console.log('=== REAL OVERHEAD ANALYSIS ===\n')

// From the logs, the MEASURABLE overheads:
const measuredOverheads = {
  workerStartup: 10,           // Worker creation and initialization
  argumentPassing: 0,          // Sending the file path (near instant)
  workerPostParse: 1.14,       // Logging + transfer list + postMessage
  zeroCopyTransfer: 0.1,       // The actual ArrayBuffer transfer
  workerTermination: 15,       // Worker cleanup
}

const totalMeasuredOverhead = Object.values(measuredOverheads).reduce((a, b) => a + b, 0)

console.log('📊 MEASURABLE OVERHEAD COMPONENTS:')
Object.entries(measuredOverheads).forEach(([key, value]) => {
  console.log(`${key.padEnd(20)}: ${value.toString().padStart(6)}ms`)
})
console.log(`${''.padEnd(20)}: ${'------'.padStart(6)}`)
console.log(`${'Total'.padEnd(20)}: ${totalMeasuredOverhead.toString().padStart(6)}ms`)
console.log('')

// The parsing times
const parsing = {
  workerA: 1395,
  workerB: 1427,
  sequentialTotal: 1395 + 1427,
  parallelActual: 1826,
}

console.log('⏱️  PARSING PERFORMANCE:')
console.log(`Sequential estimate:     ${parsing.sequentialTotal}ms`)
console.log(`Parallel actual:         ${parsing.parallelActual}ms`)
console.log(`Pure time savings:       ${parsing.sequentialTotal - parsing.parallelActual}ms`)
console.log(`Improvement:             ${((parsing.sequentialTotal - parsing.parallelActual) / parsing.sequentialTotal * 100).toFixed(1)}%`)
console.log('')

console.log('🤔 THE MYSTERY:')
console.log(`Expected parallel time:  ${Math.max(parsing.workerA, parsing.workerB)}ms (slowest worker)`)
console.log(`Plus overhead:           ${totalMeasuredOverhead}ms`)
console.log(`Expected total:          ${Math.max(parsing.workerA, parsing.workerB) + totalMeasuredOverhead}ms`)
console.log(`Actual total:            ${parsing.parallelActual}ms`)
console.log(`Unexplained gap:         ${parsing.parallelActual - Math.max(parsing.workerA, parsing.workerB) - totalMeasuredOverhead}ms`)
console.log('')

console.log('💡 POSSIBLE EXPLANATIONS:')
console.log('1. Workers running truly in parallel = max(1395, 1427) = 1427ms')
console.log('2. Plus startup/shutdown overhead = ~25ms')
console.log('3. Expected total ≈ 1452ms')
console.log('4. Actual total = 1826ms')
console.log('5. Gap = 374ms - this might be:')
console.log('   - System scheduling delays')
console.log('   - Resource contention (disk I/O, memory bandwidth)')
console.log('   - Main thread coordination time')
console.log('   - Or the workers are NOT running in perfect parallel')
console.log('')

console.log('🎯 BOTTOM LINE:')
console.log('The REAL overhead is only ~25ms (startup + shutdown + transfer)')
console.log('The other ~374ms might be workers not running in perfect parallel')
console.log('OR there\'s system-level resource contention we can\'t measure directly')