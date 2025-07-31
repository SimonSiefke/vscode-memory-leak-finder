import { Readable, Transform, Writable } from 'node:stream'

const State = {
  SearchingSnapshotToken: 0,
  SearchingSnapshotMetaData: 1,
  ParsingNodes: 2,
  parsingEdges: 3,
  ParsingStrings: 4,
  Done: 5,
}

export class StringTransform extends Transform {
  constructor() {
    super({
      objectMode: true,
    })
  }
  _transform(chunk, encoding, callback) {
    const string = chunk.toString()
    this.push(string)
    callback()
  }
}

const findSnapshotToken = (data) => {
  const snapshotToken = '"snapshot"'
  const index = data.indexOf(snapshotToken)
  return index
}

const hasBalancedJson = (data) => {
  let balance = 0
  for (let i = 0; i < data.length; i++) {
    const char = data[i]
  }
}

export class HeapSnapshotWriteStream extends Writable {
  constructor() {
    super({
      objectMode: true,
    })
    this.state = State.SearchingSnapshotToken
    this.data = ''
    this.snapshotTokenIndex = -1
  }

  async _write(chunk, encoding, callback) {
    if (this.state === State.SearchingSnapshotToken) {
      this.data += chunk
      const snapshotTokenIndex = await findSnapshotToken(this.data)
      if (snapshotTokenIndex !== -1) {
        this.snapshotTokenIndex = snapshotTokenIndex
        this.state = State.SearchingSnapshotMetaData
      }
    }
    if (this.state === State.SearchingSnapshotMetaData) {
      this.data += chunk
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
