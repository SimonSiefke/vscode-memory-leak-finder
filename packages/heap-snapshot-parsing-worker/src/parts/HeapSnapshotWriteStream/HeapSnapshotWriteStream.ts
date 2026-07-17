// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import { concatArray, concatUint32Array } from '../ConcatArray/ConcatArray.ts'
import { decodeArray } from '../DecodeArray/DecodeArray.ts'
import { HeapSnapshotParserError } from '../HeapSnapshotParserError/HeapSnapshotParserError.ts'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.ts'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.ts'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.ts'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.ts'
import * as TokenType from '../TokenType/TokenType.ts'
import { parseStringArray } from '../WriteStringArrayData/WriteStringArrayData.ts'

class HeapSnapshotWriteStream extends Writable {
  arrayIndex: number
  currentNumber: number
  data: Uint8Array<ArrayBuffer>
  edges: Uint32Array<ArrayBuffer>
  hasDigits: boolean
  intermediateArray: Uint32Array<ArrayBuffer>
  locations: Uint32Array<ArrayBuffer>
  metaData: any
  nodes: Uint32Array<ArrayBuffer>
  options: any
  state: number
  strings: string[]
  traceFunctionInfos: Uint32Array<ArrayBuffer>
  traceTree: readonly unknown[]
  validate: any

  constructor(options: { parseStrings?: boolean; validate?: boolean } = {}) {
    super()
    this.arrayIndex = 0
    this.currentNumber = 0
    this.data = new Uint8Array()
    this.edges = new Uint32Array()
    this.hasDigits = false
    this.intermediateArray = new Uint32Array(this.writableHighWaterMark)
    this.locations = new Uint32Array()
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.options = options
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
    this.strings = []
    this.traceFunctionInfos = new Uint32Array()
    this.traceTree = []
    this.validate = options.validate ?? true
  }

  /**
   * Resets parsing state for new array parsing
   */
  resetParsingState() {
    this.currentNumber = 0
    this.hasDigits = false
  }

  writeMetaData(chunk: Uint8Array): void {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const metaData = parseHeapSnapshotMetaData(dataString)
    if (metaData === EMPTY_DATA) {
      return
    }

    const nodeCount = metaData.data.node_count * metaData.data.meta.node_fields.length
    const edgeCount = metaData.data.edge_count * metaData.data.meta.edge_fields.length
    this.edges = new Uint32Array(edgeCount)
    this.metaData = metaData
    this.nodes = new Uint32Array(nodeCount)
    this.state = HeapSnapshotParsingState.ParsingNodesMetaData
    const rest = this.data.slice(metaData.endIndex)
    this.data = new Uint8Array()
    this.handleChunk(rest)
  }

  writeParsingArrayMetaData(chunk: Uint8Array, nodeName: string, nextState: number): void {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const endIndex = parseHeapSnapshotArrayHeader(dataString, nodeName)
    if (endIndex === -1) {
      return
    }

    const rest = this.data.slice(endIndex)
    this.data = new Uint8Array()
    this.arrayIndex = 0
    this.resetParsingState()
    this.state = nextState
    this.handleChunk(rest)
  }

  writeParsingNodesMetaData(chunk: Uint8Array): void {
    this.writeParsingArrayMetaData(chunk, TokenType.Nodes, HeapSnapshotParsingState.ParsingNodes)
  }

  writeArrayData(chunk: Uint8Array, array: Uint32Array, nextState: number): void {
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { arrayIndex, currentNumber, dataIndex, done, hasDigits } = parseHeapSnapshotArray(
      chunk,
      array,
      this.arrayIndex,
      this.currentNumber,
      this.hasDigits,
    )

    // If parsing failed, we need more data
    if (dataIndex === -1) {
      return
    }

    // Check array bounds
    if (arrayIndex > array.length) {
      throw new RangeError(`Array index ${arrayIndex} is out of bounds for array of length ${array.length}`)
    }

    this.arrayIndex = arrayIndex

    // Update parsing state for next chunk
    this.currentNumber = currentNumber
    this.hasDigits = hasDigits

    // Only store leftover data when we're done with this section
    if (done) {
      if (arrayIndex !== array.length) {
        throw new RangeError(`Incorrect number of elements in heapsnapshot, expected ${array.length}, but got ${arrayIndex}`)
      }

      this.resetParsingState()
      this.state = nextState
      const rest = chunk.slice(dataIndex)
      this.handleChunk(rest)
    }
    // When not done, we don't need to store leftover data - the parsing state handles it
  }

  writeParsingNodes(chunk: Uint8Array): void {
    this.writeArrayData(chunk, this.nodes, HeapSnapshotParsingState.ParsingEdgesMetaData)
  }

  writeParsingEdgesMetaData(chunk: Uint8Array): void {
    this.writeParsingArrayMetaData(chunk, TokenType.Edges, HeapSnapshotParsingState.ParsingEdges)
  }

  writeParsingEdges(chunk: Uint8Array): void {
    const traceFunctionCount = this.metaData.data.trace_function_count || 0
    const nextState =
      traceFunctionCount > 0
        ? HeapSnapshotParsingState.ParsingTraceFunctionInfosMetaData
        : HeapSnapshotParsingState.ParsingLocationsMetaData
    this.writeArrayData(chunk, this.edges, nextState)
  }

  writeParsingLocationsMetaData(chunk: Uint8Array): void {
    this.writeParsingArrayMetaData(chunk, TokenType.Locations, HeapSnapshotParsingState.ParsingLocations)
  }

  writeResizableArrayData(chunk: Uint8Array, target: 'locations' | 'traceFunctionInfos', nextState: number): void {
    if (this.intermediateArray.length < chunk.length) {
      this.intermediateArray = new Uint32Array(chunk.length)
    }
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { arrayIndex, currentNumber, dataIndex, done, hasDigits } = parseHeapSnapshotArray(
      chunk,
      this.intermediateArray,
      0,
      this.currentNumber,
      this.hasDigits,
    )

    // If parsing failed, we need more data
    if (dataIndex === -1) {
      return
    }

    // Concatenate the parsed numbers to the main array
    const parsedNumbers = this.intermediateArray.slice(0, arrayIndex)
    this[target] = concatUint32Array(this[target], parsedNumbers)

    // Update parsing state for next chunk
    this.currentNumber = currentNumber
    this.hasDigits = hasDigits

    if (done) {
      this.resetParsingState()
      this.state = nextState
      const rest = chunk.slice(dataIndex)
      this.handleChunk(rest)
    }
    // When not done, we don't need to store leftover data - the parsing state handles it
  }

  writeParsingLocations(chunk: Uint8Array): void {
    if (this.options.parseStrings) {
      this.writeResizableArrayData(chunk, 'locations', HeapSnapshotParsingState.ParsingStringsMetaData)
    } else {
      this.writeResizableArrayData(chunk, 'locations', HeapSnapshotParsingState.Done)
    }
  }

  writeParsingTraceFunctionInfosMetaData(chunk: Uint8Array): void {
    this.writeParsingArrayMetaData(chunk, TokenType.TraceFunctionInfos, HeapSnapshotParsingState.ParsingTraceFunctionInfos)
  }

  writeParsingTraceFunctionInfos(chunk: Uint8Array): void {
    this.writeResizableArrayData(chunk, 'traceFunctionInfos', HeapSnapshotParsingState.ParsingTraceTreeMetaData)
  }

  writeParsingTraceTreeMetaData(chunk: Uint8Array): void {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const endIndex = parseHeapSnapshotArrayHeader(dataString, TokenType.TraceTree)
    if (endIndex === -1) {
      return
    }
    const rest = this.data.slice(endIndex)
    this.data = new TextEncoder().encode('[')
    this.state = HeapSnapshotParsingState.ParsingTraceTree
    this.handleChunk(rest)
  }

  writeParsingTraceTree(chunk: Uint8Array): void {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    let balance = 0
    let endIndex = -1
    for (let i = 0; i < dataString.length; i++) {
      if (dataString[i] === '[') {
        balance++
      } else if (dataString[i] === ']') {
        balance--
        if (balance === 0) {
          endIndex = i + 1
          break
        }
      }
    }
    if (endIndex === -1) {
      return
    }
    this.traceTree = JSON.parse(dataString.slice(0, endIndex))
    const rest = this.data.slice(endIndex)
    this.data = new Uint8Array()
    this.state = HeapSnapshotParsingState.ParsingLocationsMetaData
    this.handleChunk(rest)
  }

  writeParsingStringsMetaData(chunk: Uint8Array): void {
    this.writeParsingArrayMetaData(chunk, 'strings', HeapSnapshotParsingState.ParsingStrings)
  }

  writeParsingStrings(chunk: Uint8Array): void {
    this.data = concatArray(this.data, chunk)
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { dataIndex, done } = parseStringArray(this.data, this.strings)

    // If parsing failed, we need more data
    if (dataIndex === -1) {
      return
    }

    this.data = this.data.slice(dataIndex)
    // Only store leftover data when we're done with this section
    if (done) {
      this.resetParsingState()
      this.state = HeapSnapshotParsingState.Done
      const rest = chunk.slice(dataIndex)
      this.handleChunk(rest)
    }
    // When not done, we don't need to store leftover data - the parsing state handles it
  }

  handleChunk(chunk: Uint8Array): void {
    switch (this.state) {
      case HeapSnapshotParsingState.Done:
        break
      case HeapSnapshotParsingState.ParsingEdges:
        this.writeParsingEdges(chunk)
        break
      case HeapSnapshotParsingState.ParsingEdgesMetaData:
        this.writeParsingEdgesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocations:
        this.writeParsingLocations(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocationsMetaData:
        this.writeParsingLocationsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingNodes:
        this.writeParsingNodes(chunk)
        break
      case HeapSnapshotParsingState.ParsingNodesMetaData:
        this.writeParsingNodesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingStrings:
        this.writeParsingStrings(chunk)
        break
      case HeapSnapshotParsingState.ParsingStringsMetaData:
        this.writeParsingStringsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingTraceFunctionInfos:
        this.writeParsingTraceFunctionInfos(chunk)
        break
      case HeapSnapshotParsingState.ParsingTraceFunctionInfosMetaData:
        this.writeParsingTraceFunctionInfosMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingTraceTree:
        this.writeParsingTraceTree(chunk)
        break
      case HeapSnapshotParsingState.ParsingTraceTreeMetaData:
        this.writeParsingTraceTreeMetaData(chunk)
        break
      case HeapSnapshotParsingState.SearchingSnapshotMetaData:
        this.writeMetaData(chunk)
        break
      default:
        break
    }
  }

  _write(chunk: Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    this.handleChunk(chunk)
    callback()
  }

  start() {}

  validateRequiredMetadata() {
    if (!this.metaData || !this.metaData.data) {
      throw new HeapSnapshotParserError('Heapsnapshot is missing metadata')
    }

    if (this.state !== HeapSnapshotParsingState.Done) {
      throw new HeapSnapshotParserError('Heap snapshot parsing did not complete successfully')
    }
  }

  _final(callback: (error?: Error | null) => void): void {
    if (this.validate) {
      this.validateRequiredMetadata()
    }

    callback()
  }

  getResult() {
    const { data } = this.metaData
    return {
      edge_count: data.edge_count,
      edges: this.edges,
      locations: this.locations,
      meta: data.meta,
      metaData: data.meta,
      node_count: data.node_count,
      nodes: this.nodes,
      strings: this.strings,
      traceFunctionInfos: this.traceFunctionInfos,
      traceTree: this.traceTree,
    }
  }
}

/**
 * Creates a new HeapSnapshotWriteStream instance
 * @param {Object} options - Options for the write stream
 * @param {boolean} [options.parseStrings=false] - Whether to parse and return strings
 * @returns {HeapSnapshotWriteStream} A new HeapSnapshotWriteStream instance
 */
export const createHeapSnapshotWriteStream = (
  options: { parseStrings?: boolean; validate?: boolean } = { parseStrings: false },
): HeapSnapshotWriteStream => {
  return new HeapSnapshotWriteStream(options)
}
