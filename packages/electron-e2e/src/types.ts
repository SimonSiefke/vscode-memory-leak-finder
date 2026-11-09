export interface ElectronContext {
  readonly pid: number
  evaluate(expression: string): Promise<unknown>
}

export interface Scenario {
  setup?(context: ElectronContext): Promise<void>
  run(context: ElectronContext): Promise<void>
  teardown?(context: ElectronContext): Promise<void>
}
