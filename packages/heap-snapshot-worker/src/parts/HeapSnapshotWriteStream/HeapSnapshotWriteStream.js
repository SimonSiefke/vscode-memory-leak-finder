// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import { concatArray, concatUint32Array } from '../ConcatArray/ConcatArray.js'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

const decodeArray = (data) => {
  return new TextDecoder().decode(data)
}

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
    super()
    this.arrayIndex = 0
    this.data = new Uint8Array()
    this.edges = new Uint32Array()
    this.intermediateArray = new Uint32Array(this.writableHighWaterMark)
    this.locations = new Uint32Array()
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
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
    this.data = this.data.slice(metaData.endIndex)
    this.edges = new Uint32Array(edgeCount)
    this.metaData = metaData
    this.nodes = new Uint32Array(nodeCount)
    this.state = HeapSnapshotParsingState.ParsingNodesMetaData
  }

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const endIndex = parseHeapSnapshotArrayHeader(dataString, nodeName)
    if (endIndex === -1) {
      return
    }
    this.arrayIndex = 0
    this.data = this.data.slice(endIndex)
    this.state = nextState
  }

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'nodes', HeapSnapshotParsingState.ParsingNodes)
  }

  writeArrayData(chunk, array, nextState) {
    this.data = concatArray(this.data, chunk)
    const { dataIndex, arrayIndex, done } = parseHeapSnapshotArray(this.data, array, this.arrayIndex)
    if (dataIndex === -1) {
      return
    }
    if (arrayIndex > array.length) {
      throw new RangeError(`Array index ${arrayIndex} is out of bounds for array of length ${array.length}`)
    }
    this.arrayIndex = arrayIndex
    if (done) {
      if (arrayIndex !== array.length) {
        throw new RangeError(`Incorrect number of nodes in heapsnapshot, expected ${array.length}, but got ${arrayIndex}`)
      }

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
    // Parse the chunk directly - no concatenation needed due to stateful parsing
    const { dataIndex, arrayIndex, done } = parseHeapSnapshotArray(chunk, this.intermediateArray, 0)
    if (dataIndex === -1) {
      return
    }

    // Concatenate the parsed numbers to the main array
    const parsedNumbers = this.intermediateArray.slice(0, arrayIndex)
    this.locations = concatUint32Array(this.locations, parsedNumbers)

    if (done) {
      this.data = chunk.slice(dataIndex)
      this.state = nextState
    }
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
