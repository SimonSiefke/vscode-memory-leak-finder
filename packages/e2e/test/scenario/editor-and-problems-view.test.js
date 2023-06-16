import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-and-problems-view");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-and-problems-view", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
