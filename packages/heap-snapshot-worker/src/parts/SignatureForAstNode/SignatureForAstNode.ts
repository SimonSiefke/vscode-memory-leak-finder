import type { AstNode, MapEntry } from '../AstNode/AstNode.ts'

export const signatureFor = (node: AstNode, depth: number): string => {
  switch (node.type) {
    case 'object': {
      const names = node.properties.map((p) => p.name).sort().join('|')
      if (depth <= 0) {
        return `o{${names}}`
      }
      const nested = node.properties
        .slice()
        .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
        .map((p) => `${p.name}:${signatureFor(p.value, depth - 1)}`)
        .join(',')
      return `o{${names}}[${nested}]`
    }
    case 'array': {
      if (depth <= 0) {
        return `a[len=${node.elements.length}]`
      }
      const children = node.elements.map((e) => signatureFor(e, depth - 1)).join(',')
      return `a[len=${node.elements.length}]<${children}>`
    }
    case 'map':
    case 'weakmap': {
      const entries: readonly MapEntry[] = node.entries
      if (depth <= 0) {
        return `m[len=${entries.length}]`
      }
      const children = entries
        .map((entry) => `k:${signatureFor(entry.key, depth - 1)}=>v:${signatureFor(entry.value, depth - 1)}`)
        .join(',')
      return `m[len=${entries.length}]{${children}}`
    }
    case 'set':
    case 'weakset': {
      if (depth <= 0) {
        return `s[len=${node.elements.length}]`
      }
      const children = node.elements.map((e) => signatureFor(e, depth - 1)).join(',')
      return `s[len=${node.elements.length}]<${children}>`
    }
    case 'code':
    case 'closure': {
      const part =
        typeof node.scriptId === 'number' && typeof node.line === 'number' && typeof node.column === 'number'
          ? `${node.scriptId}:${node.line}:${node.column}`
          : `${node.name ?? ''}`
      return `c[${node.type}:${part}]`
    }
    case 'number':
      return 'n'
    case 'string':
      return 'str'
    case 'bigint':
      return 'bi'
    case 'boolean':
      return 'b'
    case 'undefined':
      return 'u'
    case 'unknown':
    default:
      return `unk`
  }
}


