// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'
import { concatArray, concatUint32Array } from '../ConcatArray/ConcatArray.js'

const decodeArray = (data) => {
  return new TextDecoder().decode(data)
}

let nodeStart = 0
let edgeStart = 0
let locationsStart = 0

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
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
    this.snapshotTokenIndex = -1
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
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
    this.metaData = metaData
    this.nodes = new Uint32Array(nodeCount)
    this.edges = new Uint32Array(edgeCount)
    this.state = HeapSnapshotParsingState.ParsingNodesMetaData

    const leftoverData = this.data.slice(metaData.endIndex)
    // Process any leftover data with the new state
    if (leftoverData.length > 0) {
      this.handleChunk(leftoverData)
    }
  }

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const endIndex = parseHeapSnapshotArrayHeader(dataString, nodeName)
    if (endIndex === -1) {
      return
    }
    const leftoverData = this.data.slice(endIndex)
    this.arrayIndex = 0
    this.resetParsingState()
    this.state = nextState

    // Process any leftover data with the new state
    if (leftoverData.length > 0) {
      this.handleChunk(leftoverData)
    }
  }

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'nodes', HeapSnapshotParsingState.ParsingNodes)
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
      // Store any leftover data that couldn't be parsed
      this.data = chunk.slice(dataIndex)
      this.resetParsingState()
      this.state = nextState
    }
    // When not done, we don't need to store leftover data - the parsing state handles it
  }

  writeParsingNodes(chunk) {
    this.writeArrayData(chunk, this.nodes, HeapSnapshotParsingState.ParsingEdgesMetaData)
  }

  writeParsingEdgesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'edges', HeapSnapshotParsingState.ParsingEdges)
  }

  writeParsingEdges(chunk) {
    this.writeArrayData(chunk, this.edges, HeapSnapshotParsingState.ParsingLocationsMetaData)
  }

  writeParsingLocationsMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'locations', HeapSnapshotParsingState.ParsingLocations)
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

    // Only store leftover data when we're done with this section
    if (done) {
      // Store any leftover data that couldn't be parsed
      this.data = chunk.slice(dataIndex)
      this.resetParsingState()
      this.state = nextState
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
        nodeStart = performance.now()
        this.writeParsingNodesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingNodes:
        this.writeParsingNodes(chunk)
        break
      case HeapSnapshotParsingState.ParsingEdgesMetaData:
        console.log('node', performance.now() - edgeStart)
        edgeStart = performance.now()
        this.writeParsingEdgesMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingEdges:
        this.writeParsingEdges(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocationsMetaData:
        console.log('edge', performance.now() - edgeStart)
        locationsStart = performance.now()
        this.writeParsingLocationsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingLocations:
        this.writeParsingLocations(chunk)
        break
      case HeapSnapshotParsingState.Done:
        console.log('locations', performance.now() - locationsStart)
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

  getResult() {
    return {
      metaData: this.metaData,
      edges: this.edges,
      nodes: this.nodes,
      locations: this.locations,
      // TODO parse strings?
    }
  }
}
