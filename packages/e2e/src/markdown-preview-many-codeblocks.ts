import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const markdownContent = `# Code Examples

This document contains multiple code blocks in different languages.

## HTML Example

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a sample HTML page.</p>
</body>
</html>
\`\`\`

## CSS Example

\`\`\`css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f5f5f5;
}

h1 {
    color: #333;
    font-size: 2em;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
}
\`\`\`

## JavaScript Example

\`\`\`javascript
function greet(name) {
    return \`Hello, \${name}!\`;
}

const user = 'World';
console.log(greet(user));

// Arrow function example
const add = (a, b) => a + b;
console.log(add(2, 3));
\`\`\`

## More HTML

\`\`\`html
<div class="card">
    <h2>Card Title</h2>
    <p>Card content goes here.</p>
    <button onclick="handleClick()">Click me</button>
</div>
\`\`\`

## More CSS

\`\`\`css
.card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
}
\`\`\`

## More JavaScript

\`\`\`javascript
class Calculator {
    constructor() {
        this.result = 0;
    }

    add(value) {
        this.result += value;
        return this;
    }

    subtract(value) {
        this.result -= value;
        return this;
    }

    getResult() {
        return this.result;
    }
}

const calc = new Calculator();
calc.add(10).subtract(3);
console.log(calc.getResult()); // 7
\`\`\`

## HTML Form

\`\`\`html
<form id="contact-form">
    <label for="name">Name:</label>
    <input type="text" id="name" name="name" required>

    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required>

    <button type="submit">Submit</button>
</form>
\`\`\`

## CSS Grid

\`\`\`css
.grid-container {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 20px;
}

.grid-item {
    background-color: white;
    padding: 20px;
    border-radius: 4px;
}
\`\`\`

## JavaScript Async

\`\`\`javascript
async function fetchData(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

fetchData('https://api.example.com/data')
    .then(data => console.log(data))
    .catch(error => console.error(error));
\`\`\`
`

  await Workspace.setFiles([
    {
      content: markdownContent,
      name: 'code-examples.md',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('code-examples.md')
}

export const run = async ({ Editor, MarkdownPreview, QuickPick, WellKnownCommands }: TestContext): Promise<void> => {
  await Editor.open('code-examples.md')
  await QuickPick.executeCommand(WellKnownCommands.MarkdownOpenPreviewToTheSide)
  const subFrame = await MarkdownPreview.shouldBeVisible()

  // Verify we have 9 code blocks total
  await MarkdownPreview.shouldHaveCodeBlocks(subFrame, 9)

  // Verify specific languages are present
  await MarkdownPreview.shouldHaveCodeBlockWithLanguage(subFrame, 'html')
  await MarkdownPreview.shouldHaveCodeBlockWithLanguage(subFrame, 'css')
  await MarkdownPreview.shouldHaveCodeBlockWithLanguage(subFrame, 'javascript')

  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
