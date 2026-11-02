import * as JsonLanguageFeatures from '../helpers/jsonLanguageFeatures.ts'
import type { TestContext } from '../types.ts'

// Uses the same provider-dependent setup as the other CI-excluded JSON scenarios.
export const skipInCi = true

let iteration = 0

export const setup = async (context: TestContext): Promise<void> => {
  iteration = 0
  await JsonLanguageFeatures.setup(context, [])
}

export const run = async (context: TestContext): Promise<void> => {
  const { Editor, Hover, Panel, Problems, Workspace } = context
  const id = ++iteration
  const documentName = `churn-${id}.json`
  const schemaName = `churn-${id}.schema.json`
  const description = `Greeting for churn document ${id}.`
  const schema = JSON.parse(JsonLanguageFeatures.schema)
  schema.properties.greeting.description = description
  const content = (value: string): string => `{\n  "$schema": "./${schemaName}",\n  "greeting": ${value}\n}`
  await Workspace.add({ name: schemaName, content: JSON.stringify(schema) })
  await Workspace.add({ name: documentName, content: content('"hello"') })
  try {
    await Editor.open(documentName)
    await Editor.setCursor(3, 6)
    // A unique description proves this iteration's schema was resolved.
    await Editor.hover(description)
    await Hover.hide()
    await Problems.show()
    await Problems.filter(documentName)
    await Workspace.add({ name: documentName, content: content('42') })
    await Editor.shouldHaveText(content('42'))
    await Problems.shouldHaveVisibleTextCount('Incorrect type. Expected "string".', 1)
    await Workspace.add({ name: documentName, content: content('"hello"') })
    await Editor.shouldHaveText(content('"hello"'))
    await Problems.shouldHaveVisibleCount(0)
  } finally {
    await Problems.clearFilter()
    await Panel.hide()
    await JsonLanguageFeatures.closeDocument(context)
    await Workspace.remove(documentName)
    await Workspace.remove(schemaName)
  }
}

export const teardown = JsonLanguageFeatures.teardown
