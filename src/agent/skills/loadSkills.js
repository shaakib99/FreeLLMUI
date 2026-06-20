// Create a webpack context for all .md files in the target folder
const context = import.meta.webpackContext('./public', {
  recursive: false,        // only direct files, not subfolders
  regExp: /\.md$/,
});

function extractDescription(content) {
  // Same logic as your original
  if (content.startsWith('---')) {
    const end = content.indexOf('---', 3);
    if (end !== -1) {
      const yaml = content.slice(3, end).trim();
      const lines = yaml.split('\n');
      const descLine = lines.find((l) => l.toLowerCase().startsWith('description:'));
      if (descLine) {
        return descLine.split(':')[1].trim();
      }
    }
  }
  const firstLine = content.split('\n').find((l) => l.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 120) : '(no description)';
}

function extractNameFromPath(path) {
  // path is like './file.md'
  const parts = path.split('/');
  const file = parts[parts.length - 1];
  return file.replace(/\.md$/, '');
}

export async function loadAllSkills() {
  const keys = context.keys(); // e.g. ['./skill1.md', './skill2.md']

  const promises = keys.map(async (key) => {
    const name = extractNameFromPath(key);

    // Load the module once – we’ll reuse the content for both
    // description extraction and the loadContent function.
    const module = context(key);
    const content = typeof module === 'string' ? module : module.default; // handle different loaders

    const description = extractDescription(content);

    return {
      id: key,
      name,
      description,
      loadContent: async () => {
        // Since we already have the content, we return it immediately.
        // If you prefer to delay loading, you can store the context and key
        // and call context(key) inside this function.
        return Promise.resolve(content);
      },
    };
  });

  return Promise.all(promises);
}