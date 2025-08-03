// BOTTLENECK ANALYSIS: Why aren't 2 workers running in perfect parallel on 8 threads?

console.log('=== BOTTLENECK INVESTIGATION ===\n')

const data = {
  workerA: 1395,     // ms
  workerB: 1427,     // ms
  parallel: 1826,    // ms
  overhead: 26,      // ms
  fileSize: 95,      // MB each
  cpuThreads: 8,
}

console.log('🖥️  SYSTEM SPECS:')
console.log(`CPU threads:             ${data.cpuThreads}`)
console.log(`File size (each):        ${data.fileSize}MB`)
console.log(`Total data processed:    ${data.fileSize * 2}MB`)
console.log('')

console.log('⏱️  TIMING ANALYSIS:')
console.log(`Worker A (alone):        ${data.workerA}ms`)
console.log(`Worker B (alone):        ${data.workerB}ms`)
console.log(`Expected parallel:       ${Math.max(data.workerA, data.workerB)}ms (slowest)`)
console.log(`Expected + overhead:     ${Math.max(data.workerA, data.workerB) + data.overhead}ms`)
console.log(`Actual parallel:         ${data.parallel}ms`)
console.log(`Performance gap:         ${data.parallel - Math.max(data.workerA, data.workerB) - data.overhead}ms`)
console.log('')

const efficiency = Math.max(data.workerA, data.workerB) / data.parallel * 100
console.log(`Parallel efficiency:     ${efficiency.toFixed(1)}% (should be ~100% with 8 threads)`)
console.log('')

console.log('🔍 POSSIBLE BOTTLENECKS (8 threads should eliminate CPU contention):')
console.log('')

console.log('1. 💾 DISK I/O CONTENTION:')
console.log('   - Both workers reading 95MB files simultaneously')
console.log('   - Disk head seeking between two files')
console.log('   - I/O queue saturation')
console.log('   - Sequential read performance degradation')
console.log('')

console.log('2. 🧠 MEMORY BANDWIDTH SATURATION:')
console.log('   - Both workers allocating massive Uint32Arrays')
console.log('   - Memory controller contention')
console.log('   - RAM bandwidth limits (~25-50 GB/s typical)')
console.log(`   - Processing rate: ${(data.fileSize * 2 / (data.parallel / 1000)).toFixed(1)} MB/s`)
console.log('')

console.log('3. 🗂️  FILE SYSTEM OVERHEAD:')
console.log('   - File descriptor contention')
console.log('   - Buffer cache pressure')
console.log('   - OS file system locks')
console.log('')

console.log('4. ⚡ CACHE CONTENTION:')
console.log('   - L3 cache misses from large data sets')
console.log('   - Cache line bouncing between cores')
console.log('')

console.log('💡 LIKELY CULPRIT: DISK I/O')
console.log('Reading two 95MB files simultaneously is probably the bottleneck!')
console.log(`Processing rate: ${(data.fileSize * 2 / (data.parallel / 1000)).toFixed(1)} MB/s`)
console.log('Modern SSDs: ~500 MB/s, HDDs: ~100 MB/s')
console.log('')

console.log('🧪 TEST IDEAS:')
console.log('1. Copy both files to /tmp (RAM) and test again')
console.log('2. Use separate disks for each file')
console.log('3. Test with smaller files to see if gap shrinks')
console.log('4. Monitor disk I/O during execution (iostat -x 1)')