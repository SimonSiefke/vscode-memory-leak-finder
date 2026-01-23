// VSCode binary serialization format
export const DataType = {
  Undefined: 0,
  String: 1,
  Buffer: 2,
  VSBuffer: 3,
  Array: 4,
  Object: 5,
  Int: 6,
}

// Read variable-length quantity (VQL) integer
export function readIntVQL(buffer: Buffer, offset: number): { value: number; bytesRead: number } {
  let value = 0
  let shift = 0
  let bytesRead = 0

  while (true) {
    const byte = buffer[offset + bytesRead]
    bytesRead++
    value |= (byte & 0x7f) << shift
    if ((byte & 0x80) === 0) break
    shift += 7
  }

  return { value, bytesRead }
}

// Deserialize VSCode binary format
export function deserialize(buffer: Buffer, offset: number = 0): { value: any; bytesRead: number } {
  if (offset >= buffer.length) {
    return { value: undefined, bytesRead: 0 }
  }

  const type = buffer[offset]
  offset++

  switch (type) {
    case DataType.Undefined:
      return { value: undefined, bytesRead: 1 }

    case DataType.String: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const str = buffer.subarray(offset, offset + length).toString('utf8')
      return { value: str, bytesRead: 1 + lengthBytes + length }
    }

    case DataType.Buffer: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const buf = buffer.subarray(offset, offset + length)
      // Try to parse buffer contents as UTF-8 JSON, fall back to raw buffer
      try {
        const str = buf.toString('utf8')
        const parsed = JSON.parse(str)
        return { value: parsed, bytesRead: 1 + lengthBytes + length }
      } catch (e) {
        return { value: buf, bytesRead: 1 + lengthBytes + length }
      }
    }

    case DataType.VSBuffer: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const buf = buffer.subarray(offset, offset + length)
      // Try to parse buffer contents as UTF-8 JSON, fall back to raw buffer
      try {
        const str = buf.toString('utf8')
        const parsed = JSON.parse(str)
        return { value: parsed, bytesRead: 1 + lengthBytes + length }
      } catch (e) {
        return { value: buf, bytesRead: 1 + lengthBytes + length }
      }
    }

    case DataType.Array: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const result: any[] = []
      let totalBytes = 1 + lengthBytes

      for (let i = 0; i < length; i++) {
        const { value, bytesRead } = deserialize(buffer, offset)
        result.push(value)
        offset += bytesRead
        totalBytes += bytesRead
      }

      return { value: result, bytesRead: totalBytes }
    }

    case DataType.Object: {
      const { value: length, bytesRead: lengthBytes } = readIntVQL(buffer, offset)
      offset += lengthBytes
      const json = buffer.subarray(offset, offset + length).toString('utf8')
      return { value: JSON.parse(json), bytesRead: 1 + lengthBytes + length }
    }

    case DataType.Int: {
      const { value, bytesRead } = readIntVQL(buffer, offset)
      return { value, bytesRead: 1 + bytesRead }
    }

    default:
      return { value: undefined, bytesRead: 1 }
  }
}

function bufferFromContent(content: string): Buffer {
  // The monkey-patch stores binary data by doing `Buffer.from(arg).toString('utf8')`.
  // That may produce replacement characters for some byte sequences. To be resilient
  // we first try to reconstruct the raw bytes by interpreting the string as 'latin1'
  // (where each code point 0..255 maps to the same byte). If that fails to
  // deserialize we fall back to 'utf8'.
  try {
    return Buffer.from(content, 'latin1')
  } catch (e) {
    return Buffer.from(content, 'utf8')
  }
}

// Clean up the IPC messages by deserializing VSCode binary data
export function cleanMessages(messages: any[]): any[] {
  return messages.map((msg) => {
    const cleanedMsg = { ...msg }

    // Clean args
    if (msg.args && Array.isArray(msg.args)) {
      cleanedMsg.args = msg.args.map((arg) => {
        // If it's a uint8array or buffer with VSCode binary data, try to deserialize it
        if (arg && (arg.type === 'uint8array' || arg.type === 'buffer') && arg.content) {
          // Convert the content string back to a buffer, prefer 'latin1' to preserve raw bytes
          try {
            const buffer = bufferFromContent(arg.content)
            const { value, bytesRead } = deserialize(buffer)

            if (bytesRead > 0 && value !== undefined) {
              return value
            }

            // Fallback: try to parse the raw content as JSON (utf8)
            try {
              return JSON.parse(buffer.toString('utf8'))
            } catch (e) {
              return arg
            }
          } catch (e) {
            return arg
          }
        }

        // If it's a JSON string produced by the monkey-patch (JSON.stringify), try to parse it
        if (typeof arg === 'string') {
          try {
            return JSON.parse(arg)
          } catch (e) {
            return arg
          }
        }

        return arg
      })
    }

    // Clean result (for handle-response)
    if (msg.result) {
      // If it's a typed binary result, try to deserialize
      if (msg.result.type && (msg.result.type === 'uint8array' || msg.result.type === 'buffer') && msg.result.content) {
        try {
          const buffer = bufferFromContent(msg.result.content)
          const { value, bytesRead } = deserialize(buffer)

          if (bytesRead > 0 && value !== undefined) {
            cleanedMsg.result = value
          } else {
            try {
              cleanedMsg.result = JSON.parse(buffer.toString('utf8'))
            } catch (e) {
              // keep original
            }
          }
        } catch (e) {
          // keep original
        }
      } else if (typeof msg.result === 'string') {
        try {
          cleanedMsg.result = JSON.parse(msg.result)
        } catch (e) {
          // keep original
        }
      }
    }

    return cleanedMsg
  })
}
