import { createReversibleWidgetTest } from '../shared/reversibleWidget.ts'
import { antdWidgetConfigs } from '../shared/widgetConfigs/antd.ts'

export const requiresNetwork = true

export const skip = true

export const { run, setup, teardown } = createReversibleWidgetTest(antdWidgetConfigs['antd-date-picker-open-close'])
