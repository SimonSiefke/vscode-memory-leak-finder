import * as Assert from '../Assert/Assert.ts'

const splitSelectorList = (selector: string): string[] => {
  const selectors: string[] = []
  let start = 0
  let parentheses = 0
  let brackets = 0
  let quote = ''
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]
    if (quote) {
      if (char === '\\') {
        i++
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
    } else if (char === '[') {
      brackets++
    } else if (char === ']') {
      brackets--
    } else if (brackets === 0 && char === '(') {
      parentheses++
    } else if (brackets === 0 && char === ')') {
      parentheses--
    } else if (brackets === 0 && parentheses === 0 && char === ',') {
      selectors.push(selector.slice(start, i).trim())
      start = i + 1
    }
  }
  selectors.push(selector.slice(start).trim())
  return selectors
}

const extractHasSelectors = (selector: string): { selector: string; hasSelectors: string[] } => {
  let baseSelector = ''
  const hasSelectors: string[] = []
  let quote = ''
  let brackets = 0
  for (let i = 0; i < selector.length; i++) {
    const char = selector[i]
    if (quote) {
      baseSelector += char
      if (char === '\\') {
        baseSelector += selector[++i] ?? ''
      } else if (char === quote) {
        quote = ''
      }
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      baseSelector += char
      continue
    }
    if (char === '[') brackets++
    if (char === ']') brackets--
    if (brackets === 0 && selector.startsWith(':has(', i)) {
      let depth = 1
      let innerQuote = ''
      let end = i + 5
      for (; end < selector.length; end++) {
        const innerChar = selector[end]
        if (innerQuote) {
          if (innerChar === '\\') end++
          else if (innerChar === innerQuote) innerQuote = ''
        } else if (innerChar === '"' || innerChar === "'") {
          innerQuote = innerChar
        } else if (innerChar === '(') {
          depth++
        } else if (innerChar === ')' && --depth === 0) {
          break
        }
      }
      if (depth !== 0) {
        throw new SyntaxError(`Invalid selector: ${selector}`)
      }
      hasSelectors.push(selector.slice(i + 5, end).trim())
      i = end
      continue
    }
    baseSelector += char
  }
  return { selector: baseSelector.trim() || '*', hasSelectors }
}

const querySelectorRootWithHasFallback = (root: Element, selector: string): readonly HTMLElement[] => {
  try {
    return [...root.querySelectorAll<HTMLElement>(selector)]
  } catch (error) {
    if (!selector.includes(':has(')) {
      throw error
    }
  }
  const matching = new Set<HTMLElement>()
  for (const selectorBranch of splitSelectorList(selector)) {
    const { selector: baseSelector, hasSelectors } = extractHasSelectors(selectorBranch)
    const candidates = root.querySelectorAll<HTMLElement>(baseSelector)
    for (const candidate of candidates) {
      if (hasSelectors.every((hasSelector) => candidate.querySelector(hasSelector))) {
        matching.add(candidate)
      }
    }
  }
  return [...matching].sort((a, b) => {
    const position = a.compareDocumentPosition(b)
    return position & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : position & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0
  })
}

const querySelectorRoot = (root: Element, body: string): readonly HTMLElement[] => {
  Assert.object(root)
  Assert.string(body)
  return querySelectorRootWithHasFallback(root, body)
}

export const querySelectorAll = (roots: readonly Element[], body: string, _selector: string): readonly HTMLElement[] => {
  Assert.array(roots)
  Assert.string(body)
  return roots.flatMap((root) => {
    return querySelectorRoot(root, body)
  })
}
