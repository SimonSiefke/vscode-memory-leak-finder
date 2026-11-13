import type { Dynamic } from '../Types/Types.ts'
import * as DevtoolsEventType from '../DevtoolsEventType/DevtoolsEventType.ts'
export const crashInfo = { crashed: true }
export const waitForCrash = (
  targetId: string,
  rpc: Dynamic,
): {
  readonly promise: Promise<Dynamic>
  readonly dispose: () => void
} => {
  const { promise, resolve } = Promise.withResolvers()
  const onTargetCrashed = (event: Dynamic) => {
    if (event.params?.targetId === targetId) {
      resolve(crashInfo)
    }
  }
  rpc.on?.(DevtoolsEventType.TargetTargetCrashed, onTargetCrashed)
  let disposed = false
  return {
    dispose() {
      if (disposed) return
      disposed = true
      rpc.off?.(DevtoolsEventType.TargetTargetCrashed, onTargetCrashed)
      resolve(undefined)
    },
    promise,
  }
}
