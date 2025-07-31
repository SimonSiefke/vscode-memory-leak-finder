import { Writable } from 'node:stream'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'
import { parseHeapSnapshotArray } from '../ParseHeapSnapshotArray/ParseHeapSnapshotArray.js'
import * as HeapSnapshotParsingState from '../HeapSnapshotParsingState/HeapSnapshotParsingState.js'
import { parseHeapSnapshotArrayHeader } from '../ParseHeapSnapshotArrayHeader/ParseHeapSnapshotArrayHeader.js'

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
    super({
      objectMode: true,
    })
    this.state = HeapSnapshotParsingState.SearchingSnapshotMetaData
    this.data = ''
    this.snapshotTokenIndex = -1
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.edges = new Uint32Array()
  }

  writeMetaData(chunk) {
    this.data += chunk
    const metaData = parseHeapSnapshotMetaData(this.data)
    if (metaData !== EMPTY_DATA) {
      this.metaData = metaData
      this.state = HeapSnapshotParsingState.ParsingNodes
      this.data = this.data.slice(metaData.endIndex)
      const nodeCount = metaData.data.node_count
      const edgeCount = metaData.data.edge_count
      this.nodes = new Uint32Array(nodeCount)
      this.edges = new Uint32Array(edgeCount)
      console.log({ nodeCount, edgeCount })
    }
  }

  writeParsingArrayMetaData(chunk, nodeName, nextState) {
    this.data += chunk
    const endIndex = parseHeapSnapshotArrayHeader(this.data, nodeName)
    if (endIndex === -1) {
      return
    }
    this.data = this.data.slice(endIndex)
    this.state = nextState
  }

  writeParsingNodesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'nodes', HeapSnapshotParsingState.ParsingNodes)
  }

  writeParsingNodes(chunk) {
    // TODO parse nodes
    // this.data += chunk
    // const endIndex = parseHeapSnapshotArray(this.data, this.nodes)
    // // console.log(this.data)
    // this.state = HeapSnapshotParsingState.ParsingEdges
  }

  writeParsingEdgesMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'edges', HeapSnapshotParsingState.ParsingEdges)
  }

  writeParsingEdges(chunk) {
    this.state = HeapSnapshotParsingState.Done
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
