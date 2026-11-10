import type { SourceMapConsumer } from 'source-map'
import type { OriginalLocation } from '../DuplicateCode/DuplicateCode.ts'

const maxCharacters = 300
const maxLines = 5

export const addDuplicateCodePreviews = (consumer: SourceMapConsumer, locations: readonly (OriginalLocation | null)[]): void => {
  const bySource = new Map<string, OriginalLocation[]>()
  for (const location of locations) {
    if (!location) continue
    let items = bySource.get(location.source)
    if (!items) bySource.set(location.source, (items = []))
    items.push(location)
  }
  for (const [source, items] of bySource) {
    const contents = consumer.sourceContentFor(source, true)
    if (contents === null) continue
    items.sort((a, b) => a.line - b.line || a.column - b.column)
    // Scan each requested source once, without splitting whole files into lines,
    // retaining line indexes, reading files, or parsing original TypeScript ASTs.
    const newline = /\r\n|[\n\r\u2028\u2029]/g
    let nextBreak = newline.exec(contents)
    let line = 1
    let offset = 0
    for (const item of items) {
      while (line < item.line && nextBreak) {
        offset = nextBreak.index + nextBreak[0].length
        line++
        nextBreak = newline.exec(contents)
      }
      const start = offset + item.column - 1
      if (line !== item.line || start >= (nextBreak?.index ?? contents.length)) continue
      const lines = contents
        .slice(start, start + maxCharacters)
        .split(/\r\n|[\n\r\u2028\u2029]/)
        .slice(0, maxLines)
      const indent = /^[\t ]*/.exec(contents.slice(offset, offset + maxCharacters))![0].length
      const previewLines: string[] = []
      for (const [index, text] of lines.entries()) {
        previewLines.push(text)
        // Avoid including following declarations when a short function ends on
        // its first line, or a closing brace returns to the header's indentation.
        if (index === 0 && /[};],?\s*$/.test(text)) break
        if (index > 0 && /^[\t ]*\}/.test(text) && /^[\t ]*/.exec(text)![0].length <= indent) break
      }
      const excerpt = previewLines.join('\n').trim()
      if (excerpt) item.preview = excerpt
    }
  }
}
