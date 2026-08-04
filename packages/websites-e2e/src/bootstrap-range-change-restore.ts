import { createReversibleWidgetTest } from '../shared/reversibleWidget.ts'
import { bootstrapWidgetConfigs } from '../shared/widgetConfigs/bootstrap.ts'

export const requiresNetwork = true

export const skip = true

export const { run, setup, teardown } = createReversibleWidgetTest(bootstrapWidgetConfigs['bootstrap-range-change-restore'])
