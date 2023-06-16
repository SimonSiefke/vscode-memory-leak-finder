import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("editor-folding");
});

afterAll(async () => {
  await runner.kill();
});

test("editor-folding", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener equal:`)
  );
});
