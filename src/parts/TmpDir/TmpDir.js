// For more information on chrome devtools protocol, see https://github.com/aslushnikov/getting-started-with-cdp/blob/master/README.md

import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const create = () => {
  return mkdtemp(join(tmpdir(), "foo-"));
};
