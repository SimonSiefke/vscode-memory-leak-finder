// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import { concatArray, concatUint32Array } from '../ConcatArray/ConcatArray.js'
import { decodeArray } from '../DecodeArray/DecodeArray.js'
import { HeapSnapshotParserError } from '../HeapSnapshotParserError/HeapSnapshotParserError.js'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'
import * as TokenType from '../TokenType/TokenType.js'

export class HeapSnapshotWriteStream extends Writable {
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
    this.validate = false // TODO
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
    if (dataIndex === -1) {
      return
    }
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
        throw new RangeError(`Incorrect number of nodes in heapsnapshot, expected ${array.length}, but got ${arrayIndex}`)
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
    this.writeResizableArrayData(chunk, HeapSnapshotParsingState.Done)
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
    // TODO make validation required
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
