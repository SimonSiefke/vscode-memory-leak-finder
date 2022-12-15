import { createRunner } from "./_run.js";

let runner;

beforeAll(() => {
  runner = createRunner("base");
});

afterAll(async () => {
  await runner.kill();
});

test.skip("base", async () => {
  await runner.waitForSucceeded();
});
