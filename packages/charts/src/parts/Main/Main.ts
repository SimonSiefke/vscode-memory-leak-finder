import * as ApplySiteLayout from '../ApplySiteLayout/ApplySiteLayout.ts'
import * as GenerateCssSelectorStatsHtml from '../GenerateCssSelectorStatsHtml/GenerateCssSelectorStatsHtml.ts'
import * as GenerateCharts from '../GenerateCharts/GenerateCharts.ts'
import * as GenerateIndexHtml from '../GenerateIndexHtml/GenerateIndexHtml.ts'
import * as GenerateInstructionCountHtml from '../GenerateInstructionCountHtml/GenerateInstructionCountHtml.ts'

export const main = async () => {
  await GenerateCharts.generateCharts()
  await GenerateCssSelectorStatsHtml.generateCssSelectorStatsHtml()
  await GenerateIndexHtml.generateIndexHtml()
  await GenerateInstructionCountHtml.generateInstructionCountHtml()
  await ApplySiteLayout.applySiteLayout()
}
