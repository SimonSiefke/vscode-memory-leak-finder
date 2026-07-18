import type { CreateParams } from '../CreateParams/CreateParams.ts'

export const create = ({ page }: CreateParams) => {
  return {
    async getCodeMarks() {
      const result = await page.evaluate({
        expression: `(() => {
  const marks = globalThis.MonacoPerformanceMarks?.getMarks?.() || []
  return marks.filter(mark => typeof mark?.name === 'string' && mark.name.startsWith('code/'))
})()`,
        returnByValue: true,
      })
      return Array.isArray(result) ? result : []
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
