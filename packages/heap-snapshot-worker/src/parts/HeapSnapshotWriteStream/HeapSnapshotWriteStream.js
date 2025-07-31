import { Writable } from 'node:stream'
import { EMPTY_DATA, parseHeapSnapshotMetaData } from '../ParseHeapSnapshotMetaData/ParseHeapSnapshotMetaData.js'

const State = {
  SearchingSnapshotToken: 0,
  SearchingSnapshotMetaData: 1,
  ParsingNodes: 2,
  parsingEdges: 3,
  ParsingStrings: 4,
  Done: 5,
}

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
    super({
      objectMode: true,
    })
    this.state = State.SearchingSnapshotToken
    this.data = ''
    this.snapshotTokenIndex = -1
    this.metaData = {}
  }

  async _write(chunk, encoding, callback) {
    if (this.state === State.SearchingSnapshotToken) {
      this.data += chunk
      const metaData = parseHeapSnapshotMetaData(this.data)
      if (metaData !== EMPTY_DATA) {
        this.metaData = metaData
        this.state = State.ParsingNodes
      }
    }
    if (this.state === State.SearchingSnapshotMetaData) {
      // this.data += chunk
    }
    // console.log('got data', chunk.slice(0, 1))
    callback()
  }

  handleChunk(event) {
    // const { params } = event
    // const { chunk } = params
    // this.push(chunk)
  }

  async start() {}
}
