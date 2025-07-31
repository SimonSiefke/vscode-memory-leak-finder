import { Writable } from 'node:stream'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'

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
    this.nodesIndex = 0
    this.edges = new Uint32Array()
    this.edgesIndex = 0
  }

  writeMetaData(chunk) {
    this.data = new Uint8Array(Buffer.concat([this.data, chunk]))
    const dataString = new TextDecoder().decode(this.data)
    const metaData = parseHeapSnapshotMetaData(dataString)
    if (metaData === EMPTY_DATA) {
      return
    }
    this.metaData = metaData
    this.data = this.data.slice(metaData.endIndex)
    const nodeCount = metaData.data.node_count
    const edgeCount = metaData.data.edge_count
    this.nodes = new Uint32Array(nodeCount)
    this.edges = new Uint32Array(edgeCount)
    this.state = HeapSnapshotParsingState.ParsingNodes
  }

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
    this.data = new Uint8Array(Buffer.concat([this.data, chunk]))
    const endIndex = parseHeapSnapshotArrayHeader(this.data, nodeName)
    console.log({ endIndex })
    if (endIndex === -1) {
      return
    }
    this.data = this.data.slice(endIndex)
    this.state = nextState
  }

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'nodes', HeapSnapshotParsingState.ParsingNodes)
  }

  writeArrayData(chunk, array, index) {
    this.data += chunk
    const { dataIndex, arrayIndex } = parseHeapSnapshotArray(this.data, array, index)
    if (dataIndex === -1) {
      return
    }
    this.data = this.data.slice(dataIndex)
  }

  writeParsingNodes(chunk) {
    this.writeArrayData(chunk, this.nodes, this.nodesIndex)
  }

  writeParsingEdgesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'edges', HeapSnapshotParsingState.ParsingEdges)
  }

  writeParsingEdges(chunk) {
    this.writeArrayData(chunk, this.edges, this.edgesIndex)
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
