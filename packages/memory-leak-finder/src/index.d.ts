interface Measure {
  readonly create: () => any
  readonly start: () => Promise<StartMeasureResult>
  readonly stop: () => Promise<StopMeasureResult>
  readonly compare: (before: StartMeasureResult, after: StopMeasureResult) => CompareResult
  readonly id: string
}

export interface MeasureFactory<StartMeasureResult, StopMeasureResult, CompareResult> {
  create(session: import('@playwright/test').CDPSession): Measure
}

export interface Measures {
  readonly MeasureDetachedDomNodes: MeasureFactory<any, any, any>
  readonly MeasureDomNodeCount: MeasureFactory<number, number, number>
  readonly MeasureEventListenerCount: MeasureFactory<number, number, number>
  readonly MeasureEventListeners: MeasureFactory<any, any, any>
  readonly MeasureEventListenersWithStackTraces: MeasureFactory<any, any, any>
  readonly MeasureMutationObserverCount: MeasureFactory<number, number, number>
  readonly MeasureResizeObserverCount: MeasureFactory<number, number, number>
  readonly MeasureIntersectionObserverCount: MeasureFactory<number, number, number>
  readonly MeasureDetachedDomNodeCount: MeasureFactory<number, number, number>
  readonly MeasureObservers: MeasureFactory<any, any, any>
  readonly MeasureObserversWithStackTraces: MeasureFactory<any, any, any>
  readonly MeasureSetTimeout: MeasureFactory<number, number, number>
  readonly MeasureWindowCount: MeasureFactory<number, number, number>
  readonly MeasurePromiseCount: MeasureFactory<number, number, number>
  readonly MeasureMediaQueryListCount: MeasureFactory<number, number, number>
}

export const Measures: Measures

export const combine: (...measures: readonly Measure[]) => Measure
