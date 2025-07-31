// based on chrome devtools HeapSnapshotLoader.ts (https://github.com/ChromeDevTools/devtools-frontend/blob/main/front_end/entrypoints/heap_snapshot_worker/HeapSnapshotLoader.ts), BSD-3-Clause license

import { Writable } from 'node:stream'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { parseHeapSnapshotArrayWithDynamicSize } from '../ParseHeapSnapshotArrayWithDynamicSize/ParseHeapSnapshotArrayWithDynamicSize.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

const concatArray = (array, other) => {
  // TODO check if concatenating many uint8 arrays could possibly negatively impact performance
  return new Uint8Array(Buffer.concat([array, other]))
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
    this.edges = new Uint32Array()
    this.locationsState = { array: null, buffer: null, capacity: 0 }
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.snapshotTokenIndex = -1
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
    console.log({ watermark: this.writableHighWaterMark })
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
    this.data = this.data.slice(dataIndex)
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
    this.data = concatArray(this.data, chunk)

    const { dataIndex, arrayIndex, done } = parseHeapSnapshotArrayWithDynamicSize(this.data, this.locationsState, this.arrayIndex)
    if (dataIndex === -1) {
      return
    }

    this.arrayIndex = arrayIndex
    this.data = this.data.slice(dataIndex)

    if (done) {
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
      locations: this.locationsState.array,
      // TODO parse strings?
    }
  }
}
