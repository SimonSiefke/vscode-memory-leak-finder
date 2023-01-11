import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-scrolling");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-scrolling", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
