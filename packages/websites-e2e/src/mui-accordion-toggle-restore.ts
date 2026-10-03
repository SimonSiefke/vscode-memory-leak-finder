import { createReversibleWidgetTest } from '../shared/reversibleWidget.ts'
import { muiWidgetConfigs } from '../shared/widgetConfigs/mui.ts'

export const requiresNetwork = true

export const skip = true

export const { run, setup, teardown } = createReversibleWidgetTest(muiWidgetConfigs['mui-accordion-toggle-restore'])
