// Run after Mocha loads the shared suite, before tests start. Only the known
// cross-version label alias is accepted; option values, checked defaults, section
// ordering, and every other header still go through the upstream deep assertion.
export const smokeCompatibility = `
const { Chat } = load(join(root, '../automation/out/index.js'));
const { MOCK_CONFIG_MODEL_DEFAULT_SECTIONS: defaults } = load(join(root, 'out/utils.js'));
const effortHeaders = ['Thinking Effort', 'Effort Level'];
const expectedEffort = defaults?.find(section => effortHeaders.includes(section.header))?.header;
if (expectedEffort && Chat?.prototype.getModelConfigSections) {
  const getSections = Chat.prototype.getModelConfigSections;
  Chat.prototype.getModelConfigSections = async function (...args) {
    const sections = await getSections.apply(this, args);
    return sections.map(section => {
      if (!effortHeaders.includes(section.header) || section.header === expectedEffort) return section;
      console.log('[smoke-compatibility] model effort header: ' + JSON.stringify(section.header) + ' -> ' + JSON.stringify(expectedEffort));
      return { ...section, header: expectedEffort };
    });
  };
}
`
