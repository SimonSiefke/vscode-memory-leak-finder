import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'main.cpp',
      content: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int i = 0; i < numbers.size(); i++) {
        sum += numbers[i];
    }

    std::cout << "Sum: " << sum << std::endl;
    return 0;
}
`,
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('main.cpp')
  await Editor.shouldHaveText(`#include <iostream>
#include <vector>

int main() {
    std::vector<int> numbers = {1, 2, 3, 4, 5};
    int sum = 0;

    for (int i = 0; i < numbers.size(); i++) {
        sum += numbers[i];
    }

    std::cout << "Sum: " << sum << std::endl;
    return 0;
}
`)
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('int')
  await Editor.closeInspectedTokens()
  await Editor.close()
}
