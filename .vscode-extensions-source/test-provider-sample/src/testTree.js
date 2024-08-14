const { TextDecoder } = require('util')
const vscode = require('vscode')
const { parseMarkdown } = require('./parser')

const textDecoder = new TextDecoder('utf-8')

exports.testData = new WeakMap()

let generationCounter = 0

exports.getContentFromFilesystem = async (uri) => {
  try {
    const rawContent = await vscode.workspace.fs.readFile(uri)
    return textDecoder.decode(rawContent)
  } catch (e) {
    console.warn(`Error providing tests for ${uri.fsPath}`, e)
    return ''
  }
}

export class TestFile {
  didResolve = false

  async updateFromDisk(controller, item) {
    try {
      const content = await getContentFromFilesystem(item.uri)
      item.error = undefined
      this.updateFromContents(controller, content, item)
    } catch (e) {
      item.error = e.stack
    }
  }

  /**
   * Parses the tests from the input text, and updates the tests contained
   * by this file to be those from the text,
   */
  updateFromContents(controller, content, item) {
    const ancestors = [{ item, children: [] }]
    const thisGeneration = generationCounter++
    this.didResolve = true

    const ascend = (depth) => {
      while (ancestors.length > depth) {
        const finished = ancestors.pop()
        finished.item.children.replace(finished.children)
      }
    }

    parseMarkdown(content, {
      onTest: (range, a, operator, b, expected) => {
        const parent = ancestors[ancestors.length - 1]
        const data = new TestCase(a, operator, b, expected, thisGeneration)
        const id = `${item.uri}/${data.getLabel()}`

        const tcase = controller.createTestItem(id, data.getLabel(), item.uri)
        testData.set(tcase, data)
        tcase.range = range
        parent.children.push(tcase)
      },

      onHeading: (range, name, depth) => {
        ascend(depth)
        const parent = ancestors[ancestors.length - 1]
        const id = `${item.uri}/${name}`

        const thead = controller.createTestItem(id, name, item.uri)
        thead.range = range
        testData.set(thead, new TestHeading(thisGeneration))
        parent.children.push(thead)
        ancestors.push({ item: thead, children: [] })
      },
    })

    ascend(0) // finish and assign children for all remaining items
  }
}

export class TestHeading {
  constructor(generation) {
    this.generation = generation
  }
}

export class TestCase {
  constructor(a, operator, b, expected, generation) {
    this.a = a
    this.operator = operator
    this.b = b
    this.expected = expected
    this.generation = generation
  }

  getLabel() {
    return `${this.a} ${this.operator} ${this.b} = ${this.expected}`
  }

  async run(item, options) {
    const start = Date.now()
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
    const actual = this.evaluate()
    const duration = Date.now() - start

    if (actual === this.expected) {
      options.passed(item, duration)
    } else {
      const message = vscode.TestMessage.diff(`Expected ${item.label}`, String(this.expected), String(actual))
      message.location = new vscode.Location(item.uri, item.range)
      options.failed(item, message, duration)
    }
  }

  evaluate() {
    switch (this.operator) {
      case '-':
        return this.a - this.b
      case '+':
        return this.a + this.b
      case '/':
        return Math.floor(this.a / this.b)
      case '*':
        return this.a * this.b
    }
  }
}
