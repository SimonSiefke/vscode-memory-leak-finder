import { Writable } from 'node:stream'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

const concatArray = (array, other) => {
  return new Uint8Array(Buffer.concat([array, other]))
}

const decodeArray = (data) => {
  return new TextDecoder().decode(data)
}

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
    super({
      objectMode: true,
    })
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
    this.data = new Uint8Array()
    this.snapshotTokenIndex = -1
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.edges = new Uint32Array()
    this.arrayIndex = 0
  }

  writeMetaData(chunk) {
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    const metaData = parseHeapSnapshotMetaData(dataString)
    if (metaData === EMPTY_DATA) {
      return
    }
    const nodeCount = metaData.data.node_count
    const edgeCount = metaData.data.edge_count
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
    console.log({ endIndex })
    if (endIndex === -1) {
      return
    }
    this.data = this.data.slice(endIndex)
    console.log(decodeArray(this.data.slice(0, 100)))
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
    this.arrayIndex = arrayIndex
    this.data = this.data.slice(dataIndex)
    if (done) {
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
    this.writeArrayData(chunk, this.edges, HeapSnapshotParsingState.Done)
    // this.state = HeapSnapshotParsingState.Done
  }

  async _write(chunk, encoding, callback) {
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
      default:
        break
    }
    callback()
  }

  async start() {}
}
