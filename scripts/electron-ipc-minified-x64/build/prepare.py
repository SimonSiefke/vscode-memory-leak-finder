"""Repair the pinned local Copilot packaging path without changing product code."""
from pathlib import Path
import sys

root = Path(sys.argv[1])
source = root / 'build/lib/extensions.ts'
text = source.read_text()
start = text.index('export function packageCopilotExtensionStream(): Stream {')
end = text.index('\n}', start) + 2
section = text[start:end]
anchor = "path.join(root, 'build', '.moduleignore')"
if section.count(anchor) != 1:
    raise RuntimeError('Unexpected pinned Copilot packaging implementation')
section = section.replace(anchor, "path.join(root, 'build', '.moduleignore.benchmark-copilot')")
source.write_text(text[:start] + section + text[end:])
# The app's global rules strip the standalone CLI. The extension embeds its
# version-matched SDK, which prepareBuiltInCopilotRipgrepShim requires later.
# Restrict these exceptions to the extension's own dependency stream.
original = (root / 'build/.moduleignore').read_text()
(root / 'build/.moduleignore.benchmark-copilot').write_text(original + '\n!@github/copilot/package.json\n!@github/copilot/sdk/**\n')
print('Retained extension-owned Copilot SDK for the standard packaging task')
