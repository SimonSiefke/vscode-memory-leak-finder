// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

/**
 *
 * @param {Uint8Array} array
 * @param {Uint8Array} other
 * @returns {Uint8Array<ArrayBuffer>}
 */
const concatArray = (array, other) => {
  // TODO check if concatenating many uint8 arrays could possibly negatively impact performance
  return new Uint8Array(Buffer.concat([array, other]))
}

/**
 *
 * @param {Uint32Array} array
 * @param {Uint32Array} other
 * @returns {Uint32Array<ArrayBuffer>}
 */
const concatUint32Array = (array, other) => {
  const result = new Uint32Array(array.length + other.length)
  result.set(array)
  result.set(other, array.length)
  return result
}

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
    this.data = new Uint8Array()

    // Parsing state for stateful parsing (avoiding concatenation)
    this.currentNumber = 0
    this.hasDigits = false

    this.edges = new Uint32Array()
    this.locations = new Uint32Array()
    this.intermediateArray = new Uint32Array(this.writableHighWaterMark)
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
    this.data = this.data.slice(metaData.endIndex)
    this.nodes = new Uint32Array(nodeCount)
    this.edges = new Uint32Array(edgeCount)
    this.state = HeapSnapshotParsingState.ParsingNodesMetaData
  }

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const endIndex = parseHeapSnapshotArrayHeader(dataString, nodeName)
    if (endIndex === -1) {
      return
    }
    this.data = this.data.slice(endIndex)
    this.arrayIndex = 0
    this.resetParsingState()
    this.state = nextState
  }

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'nodes', HeapSnapshotParsingState.ParsingNodes)
  }

  writeArrayData(chunk, array, nextState) {
    this.data = concatArray(this.data, chunk)

    const { dataIndex, arrayIndex, done, currentNumber, hasDigits } = parseHeapSnapshotArray(this.data, array, this.arrayIndex, this.currentNumber, this.hasDigits)
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

    this.data = this.data.slice(dataIndex)
    if (done) {
      if (arrayIndex !== array.length) {
        throw new RangeError(`Incorrect number of nodes in heapsnapshot, expected ${array.length}, but got ${arrayIndex}`)
      }
      this.resetParsingState()
      this.state = nextState
    }
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
    this.data = concatArray(this.data, chunk)

    const { dataIndex, arrayIndex, done, currentNumber, hasDigits } = parseHeapSnapshotArray(this.data, this.intermediateArray, 0, this.currentNumber, this.hasDigits)
    if (dataIndex === -1) {
      return
    }

    // Concatenate the parsed numbers to the main array
    const parsedNumbers = this.intermediateArray.slice(0, arrayIndex)
    this.locations = concatUint32Array(this.locations, parsedNumbers)

    // Update parsing state for next chunk
    this.currentNumber = currentNumber
    this.hasDigits = hasDigits

    this.data = this.data.slice(dataIndex)

    if (done) {
      this.resetParsingState()
      this.state = nextState
    }
  }

  writeParsingLocations(chunk) {
    this.writeResizableArrayData(chunk, HeapSnapshotParsingState.Done)
  }

  _write(chunk, encoding, callback) {
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
