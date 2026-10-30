// A comparison model for compressed-pointer V8, not an engine allocation profiler.
export const allocationBytesPreamble = `(() => {
  if (globalThis.trackAllocationBytes) return
  const { Object, Reflect, Map, Set, ArrayBuffer, String, Number, BigInt, Array, Math } = globalThis
  let statistics = Object.create(null)
  const ownKeys = Reflect.ownKeys
  const descriptor = Object.getOwnPropertyDescriptor
  const mapSize = descriptor(Map.prototype, 'size').get
  const setSize = descriptor(Set.prototype, 'size').get
  const bufferLength = descriptor(ArrayBuffer.prototype, 'byteLength').get
  const stringValue = String.prototype.valueOf
  const numberValue = Number.prototype.valueOf
  const bigintString = BigInt.prototype.toString
  const align = bytes => Math.ceil(bytes / 4) * 4
  const stringBytes = value => align(12 + value.length * 2)
  const numberBytes = value => Number.isInteger(value) && !Object.is(value, -0) && value >= -1073741824 && value <= 1073741823 ? 0 : 12

  const estimate = (value, type) => {
    if (typeof value === 'string') return stringBytes(value)
    if (typeof value === 'number') return numberBytes(value)
    if (typeof value === 'bigint') return align(16 + Math.ceil(bigintString.call(value, 2).replace('-', '').length / 64) * 8)
    if (value === null || typeof value === 'boolean' || typeof value === 'undefined') return 0
    if (typeof value === 'symbol' || typeof value === 'function') return null
    if (Array.isArray(value)) {
      const length = descriptor(value, 'length').value
      return 16 + (length === 0 ? 0 : align(8 + length * 4))
    }
    // Views do not own their backing buffer; explicit ArrayBuffer sites account for it.
    if (ArrayBuffer.isView(value)) return 64
    switch (type) {
      case 'Map': return 32 + mapSize.call(value) * 24
      case 'Set': return 24 + setSize.call(value) * 16
      case 'WeakMap':
      case 'WeakSet': return 32
      case 'WeakRef': return 16
      case 'ArrayBuffer': return 32 + bufferLength.call(value)
      case 'String': return 16 + stringBytes(stringValue.call(value))
      case 'Number': return 16 + numberBytes(numberValue.call(value))
      case 'RegExp': return 24
      case 'Date': return 16
      default: return align(12 + ownKeys(value).length * 4)
    }
  }

  globalThis.trackAllocationBytes = (value, scriptId, line, column, allocationType) => {
    const valueType = typeof value
    // Comparison/logical expressions can return a primitive without allocating.
    if (value === null || valueType === 'boolean' || valueType === 'undefined') return value
    const type = valueType === 'object' || valueType === 'function' ? allocationType : valueType
    const location = scriptId + ':' + line + ':' + column
    const key = location + ':' + type
    const entry = statistics[key] ||= { createdCount: 0, estimatedBytes: 0, unknownCount: 0, location, type }
    entry.createdCount++
    let bytes = null
    try {
      bytes = estimate(value, type)
    } catch {
      // Revoked proxies and unsupported exotic objects must not break the app.
    }
    if (bytes === null || !Number.isSafeInteger(bytes) || bytes < 0) {
      entry.unknownCount++
    } else {
      entry.estimatedBytes += bytes
    }
    return value
  }
  globalThis.getAllocationByteStatistics = () => {
    const result = Object.create(null)
    for (const [key, entry] of Object.entries(statistics)) result[key] = { ...entry }
    return result
  }
  globalThis.resetAllocationByteStatistics = () => { statistics = Object.create(null) }
})();
`
