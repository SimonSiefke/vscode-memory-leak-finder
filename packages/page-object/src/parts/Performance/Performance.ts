import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ page }: CreateParams) => {
  return {
    async armActionTiming({
      expectedText,
      fileName,
      quietTimeoutMs = 3000,
      quietWindowMs = 100,
      readyTimeoutMs = 10_000,
    }: {
      readonly expectedText: string
      readonly fileName: string
      readonly quietTimeoutMs?: number
      readonly quietWindowMs?: number
      readonly readyTimeoutMs?: number
    }) {
      await page.evaluateInMainWorld({
        awaitPromise: true,
        expression: `new Promise((resolve, reject) => {
  const quietWindowMs = ${JSON.stringify(quietWindowMs)}
  const deadline = performance.now() + ${JSON.stringify(quietTimeoutMs)}
  let lastActivity = performance.now()
  const observer = typeof PerformanceObserver === 'function'
    ? new PerformanceObserver(entries => {
        for (const entry of entries.getEntries()) {
          lastActivity = Math.max(lastActivity, entry.startTime + entry.duration)
        }
      })
    : undefined
  const mutationObserver = new MutationObserver(() => {
    lastActivity = performance.now()
  })
  try {
    observer?.observe({ entryTypes: ['longtask'] })
  } catch {
    observer?.disconnect()
  }
  mutationObserver.observe(document.body, {
    characterData: true,
    childList: true,
    subtree: true,
  })
  const dispose = () => {
    mutationObserver.disconnect()
    observer?.disconnect()
  }
  const check = () => {
    const now = performance.now()
    if (document.visibilityState === 'visible' && now - lastActivity >= quietWindowMs) {
      dispose()
      resolve(undefined)
      return
    }
    if (now >= deadline) {
      dispose()
      reject(new Error('renderer did not become quiet within ${JSON.stringify(quietTimeoutMs)}ms'))
      return
    }
    requestAnimationFrame(check)
  }
  requestAnimationFrame(check)
})`,
        returnByValue: true,
      })
      await page.evaluateInMainWorld({
        expression: `(() => {
  const key = '__vscodeMemoryLeakFinderActionTiming'
  const previous = globalThis[key]
  previous?.dispose?.()

  const fileName = ${JSON.stringify(fileName)}
  const expectedText = ${JSON.stringify(expectedText)}
  const readyTimeoutMs = ${JSON.stringify(readyTimeoutMs)}
  const normalizeText = value => String(value || '').replaceAll('\\u00a0', ' ').replace(/\\r?\\n/g, '')
  const isVisible = element => Boolean(element && element.getClientRects().length > 0)
  const snapshotCounts = () => {
    const functions = typeof globalThis.getFunctionStatistics === 'function'
      ? { ...globalThis.getFunctionStatistics() }
      : {}
    const allocationStatistics = typeof globalThis.getAllocationStatistics === 'function'
      ? globalThis.getAllocationStatistics()
      : {}
    const allocations = {}
    for (const [location, entry] of Object.entries(allocationStatistics)) {
      allocations[location] = Number(entry?.createdCount) || 0
    }
    return { allocations, functions }
  }
  const subtractCounts = (before, after) => {
    const result = {}
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      const delta = (Number(after[key]) || 0) - (Number(before[key]) || 0)
      if (delta > 0) {
        result[key] = delta
      }
    }
    return result
  }
  const workBefore = snapshotCounts()
  let disposed = false
  let rejectResult
  let resolveResult
  const promise = new Promise((resolve, reject) => {
    rejectResult = reject
    resolveResult = resolve
  })
  const timeout = setTimeout(() => {
    dispose()
    rejectResult(new Error('renderer action did not become ready within ' + readyTimeoutMs + 'ms'))
  }, readyTimeoutMs)
  const dispose = () => {
    if (disposed) {
      return
    }
    disposed = true
    clearTimeout(timeout)
    globalThis.removeEventListener('keydown', onKeyDown, true)
  }
  const isReady = () => {
    const escapedName = CSS.escape(fileName)
    const tab = document.querySelector('[role="tab"][data-resource-name="' + escapedName + '"]')
    const editor = document.querySelector('.editor-instance[aria-label^="' + escapedName + '"]')
    const breadcrumbs = [...document.querySelectorAll('.monaco-breadcrumb-item')]
    const breadcrumb = breadcrumbs.find(element => isVisible(element) && element.textContent?.includes(fileName))
    const viewLines = editor?.querySelector('.view-lines')
    const activeTab = tab?.getAttribute('aria-selected') === 'true' || tab?.classList.contains('active')
    return Boolean(
      activeTab &&
      isVisible(tab) &&
      isVisible(editor) &&
      breadcrumb &&
      isVisible(viewLines) &&
      normalizeText(viewLines?.textContent) === normalizeText(expectedText)
    )
  }
  const pollReady = actionStartMs => {
    if (disposed) {
      return
    }
    if (!isReady()) {
      requestAnimationFrame(() => pollReady(actionStartMs))
      return
    }
    const domReadyMs = performance.now()
    const workAfter = snapshotCounts()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const paintReadyMs = performance.now()
        dispose()
        resolveResult({
          actionStartMs,
          domReadyMs,
          paintReadyMs,
          work: {
            allocations: subtractCounts(workBefore.allocations, workAfter.allocations),
            functions: subtractCounts(workBefore.functions, workAfter.functions),
          },
        })
      })
    })
  }
  const onKeyDown = event => {
    if (event.key !== 'Enter') {
      return
    }
    globalThis.removeEventListener('keydown', onKeyDown, true)
    pollReady(performance.now())
  }
  globalThis.addEventListener('keydown', onKeyDown, true)
  globalThis[key] = { dispose, promise }
})()`,
        returnByValue: true,
      })
    },
    async getCodeMarks() {
      const result = await page.evaluateInMainWorld({
        expression: `(() => {
  const marks = globalThis.MonacoPerformanceMarks?.getMarks?.() || []
  return marks.filter(mark => typeof mark?.name === 'string' && mark.name.startsWith('code/'))
})()`,
        returnByValue: true,
      })
      return Array.isArray(result) ? result : []
    },
    async readActionTiming() {
      return page.evaluateInMainWorld({
        awaitPromise: true,
        expression: `globalThis.__vscodeMemoryLeakFinderActionTiming?.promise`,
        returnByValue: true,
      })
    },
    async waitForAnimationFrames(count = 2) {
      await page.evaluate({
        awaitPromise: true,
        expression: `new Promise(resolve => {
  let remaining = ${JSON.stringify(count)}
  const next = () => {
    remaining--
    if (remaining <= 0) {
      resolve(undefined)
      return
    }
    requestAnimationFrame(next)
  }
  requestAnimationFrame(next)
})`,
        returnByValue: true,
      })
    },
  }
}
