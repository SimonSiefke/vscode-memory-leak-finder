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
import { writeStringArrayData } from '../WriteStringArrayData/WriteStringArrayData.ts'

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
  validate: any

  constructor(options) {
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
    this.validate = options.validate ?? true
  }

  /**
   * Resets parsing state for new array parsing
   */
  resetParsingState() {
    this.currentNumber = 0
    this.hasDigits = false
  }

  writeMetaData(chunk) {
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

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
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

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, TokenType.Nodes, HeapSnapshotParsingState.ParsingNodes)
  }

  writeArrayData(chunk, array, nextState) {
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { dataIndex, arrayIndex, done, currentNumber, hasDigits } = parseHeapSnapshotArray(
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

  writeParsingNodes(chunk) {
    this.writeArrayData(chunk, this.nodes, HeapSnapshotParsingState.ParsingEdgesMetaData)
  }

  writeParsingEdgesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, TokenType.Edges, HeapSnapshotParsingState.ParsingEdges)
  }

  writeParsingEdges(chunk) {
    this.writeArrayData(chunk, this.edges, HeapSnapshotParsingState.ParsingLocationsMetaData)
  }

  writeParsingLocationsMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, TokenType.Locations, HeapSnapshotParsingState.ParsingLocations)
  }

  writeResizableArrayData(chunk, nextState) {
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { dataIndex, arrayIndex, done, currentNumber, hasDigits } = parseHeapSnapshotArray(
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
    this.locations = concatUint32Array(this.locations, parsedNumbers)

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

  writeParsingLocations(chunk) {
    if (this.options.parseStrings) {
      this.writeResizableArrayData(chunk, HeapSnapshotParsingState.ParsingStringsMetaData)
    } else {
      this.writeResizableArrayData(chunk, HeapSnapshotParsingState.Done)
    }
  }

  writeParsingStringsMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'strings', HeapSnapshotParsingState.ParsingStrings)
  }

  writeParsingStrings(chunk) {
    const success = writeStringArrayData(
      chunk,
      this.data,
      this.strings,
      () => this.resetParsingState(),
      () => {
        this.state = HeapSnapshotParsingState.Done
      },
      (newData) => {
        this.data = newData
      },
    )

    if (!success) {
      this.data = concatArray(this.data, chunk)
    }
  }

  handleChunk(chunk) {
    switch (this.state) {
      case HeapSnapshotParsingState.SearchingSnapshotMetaData:
        this.writeMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingNodesMetaData:
        this.writeParsingNodesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingNodes:
        this.writeParsingNodes(chunk)
        break
      case HeapSnapshotParsingState.ParsingEdgesMetaData:
        this.writeParsingEdgesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingEdges:
        this.writeParsingEdges(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocationsMetaData:
        this.writeParsingLocationsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocations:
        this.writeParsingLocations(chunk)
        break
      case HeapSnapshotParsingState.ParsingStringsMetaData:
        this.writeParsingStringsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingStrings:
        this.writeParsingStrings(chunk)
        break
      case HeapSnapshotParsingState.Done:
        break
      default:
        break
    }
  }

  _write(chunk, encoding, callback) {
    this.handleChunk(chunk)
    callback()
  }

  start() {}

  validateRequiredMetadata() {
    if (!this.metaData || !this.metaData.data) {
      throw new HeapSnapshotParserError('Missing required metadata in heap snapshot')
    }

    if (this.state !== HeapSnapshotParsingState.Done) {
      throw new HeapSnapshotParserError('Heap snapshot parsing did not complete successfully')
    }
  }

  _final(callback) {
    if (this.validate) {
      this.validateRequiredMetadata()
    }
    callback()
  }

  getResult() {
    return {
      metaData: this.metaData,
      edges: this.edges,
      nodes: this.nodes,
      locations: this.locations,
      strings: this.strings,
    }
  }
}

/**
 * Creates a new HeapSnapshotWriteStream instance
 * @param {Object} options - Options for the write stream
 * @param {boolean} [options.parseStrings=false] - Whether to parse and return strings
 * @returns {HeapSnapshotWriteStream} A new HeapSnapshotWriteStream instance
 */
export const createHeapSnapshotWriteStream = (options = { parseStrings: false }) => {
  return new HeapSnapshotWriteStream(options)
}
