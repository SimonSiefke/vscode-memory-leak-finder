import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("sample.extension-search");
});

afterAll(async () => {
  await runner.kill();
});

test("sample.extension-search", async () => {
  await runner.waitForSucceeded();
  expect(runner.stdout).toContainEqual(
    expect.stringContaining(`event listener increase:`)
  );
});
