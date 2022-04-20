import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-hover-toggle");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-hover-toggle", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
