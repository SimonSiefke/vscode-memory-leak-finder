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
  constructor(options = {}) {
    super()
    const { parseStrings = false } = options
    this.arrayIndex = 0
    this.currentNumber = 0
    this.data = new Uint8Array()
    this.edges = new Uint32Array()
    this.hasDigits = false
    this.intermediateArray = new Uint32Array(this.writableHighWaterMark)
    this.locations = new Uint32Array()
    this.metaData = {}
    this.nodes = new Uint32Array()
    this.parseStrings = parseStrings
    this.strings = parseStrings ? /** @type {string[]} */ ([]) : null
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

    if (done) {
      this.resetParsingState()
      this.state = nextState
      const rest = chunk.slice(dataIndex)
      this.handleChunk(rest)
    }
    // When not done, we don't need to store leftover data - the parsing state handles it
  }

  writeParsingLocations(chunk) {
    if (this.parseStrings) {
      this.writeResizableArrayData(chunk, HeapSnapshotParsingState.ParsingStringsMetaData)
    } else {
      this.writeResizableArrayData(chunk, HeapSnapshotParsingState.Done)
    }
  }

  writeParsingStringsMetaData(chunk) {
    this.writeParsingArrayMetaData(chunk, 'strings', HeapSnapshotParsingState.ParsingStrings)
  }

  writeParsingStrings(chunk) {
    this.writeStringArrayData(chunk, HeapSnapshotParsingState.Done)
  }

  writeStringArrayData(chunk, nextState) {
    // For strings, we need to parse JSON string values, not numbers
    this.data = concatArray(this.data, chunk)
    const dataString = decodeArray(this.data)
    console.log('[HeapSnapshotWriteStream] Parsing strings, data length:', dataString.length)
    console.log('[HeapSnapshotWriteStream] Data preview:', dataString.slice(0, 100))

    // Try to parse the strings array as JSON
    try {
      // Look for the end of the strings array
      let bracketCount = 0
      let inString = false
      let escapeNext = false
      let endIndex = -1

      for (let i = 0; i < dataString.length; i++) {
        const char = dataString[i]

        if (escapeNext) {
          escapeNext = false
          continue
        }

        if (char === '\\') {
          escapeNext = true
          continue
        }

        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }

        if (!inString) {
          if (char === '[') {
            bracketCount++
          } else if (char === ']') {
            bracketCount--
            if (bracketCount === 0) {
              endIndex = i + 1
              break
            }
          }
        }
      }

      if (endIndex === -1) {
        return // Not enough data yet
      }

      // Extract the strings array JSON
      const stringsJson = dataString.slice(0, endIndex)
      console.log('[HeapSnapshotWriteStream] Extracted JSON:', stringsJson)
      const strings = JSON.parse(stringsJson)

      if (Array.isArray(strings)) {
        this.strings = /** @type {string[]} */ (strings)
        console.log('[HeapSnapshotWriteStream] Parsed strings:', this.strings)
      }

      this.resetParsingState()
      this.state = nextState
      const rest = this.data.slice(endIndex)
      this.data = new Uint8Array()
      this.handleChunk(rest)
    } catch (error) {
      // Not enough data yet or invalid JSON, continue accumulating
      return
    }
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
      case HeapSnapshotParsingState.ParsingStringsMetaData:
        this.writeParsingStringsMetaData(chunk)
        break
      case HeapSnapshotParsingState.ParsingStrings:
        this.writeParsingStrings(chunk)
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
    const result = {
      metaData: this.metaData,
      edges: this.edges,
      nodes: this.nodes,
      locations: this.locations,
    }

    if (this.parseStrings && this.strings) {
      result.strings = this.strings
    }

    return result
  }
}
