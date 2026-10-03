import { createReversibleWidgetTest } from '../shared/reversibleWidget.ts'
import { jqueryUiWidgetConfigs } from '../shared/widgetConfigs/jqueryUi.ts'

export const requiresNetwork = true

export const skip = true

export const { run, setup, teardown } = createReversibleWidgetTest(jqueryUiWidgetConfigs['jqueryui-toggleclass-run-restore'])
